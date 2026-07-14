process.loadEnvFile();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const getDbConnection = require("../utils/db");
const sqsClient = new SQSClient({
    region: process.env.AWS_REGION
});
const queueUrl = process.env.SQS_QUEUE_URL;
async function processS3Record(record) {
    const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    console.log(`Processing S3 key: ${s3Key}`);
    const parts = s3Key.split('/');
    if (parts.length < 3) {
        console.warn(`Key "${s3Key}" does not match format user_id/session_id/image_id, skipping database update.`);
        return;
    }
    const user_id = parts[0];
    const session_id = parts[1];
    const image_id = parts.slice(2).join('/');
    let connection;
    try {
        connection = await getDbConnection();
        const result = await connection.execute(
            `UPDATE images 
             SET status = :status 
             WHERE user_id = :user_id 
               AND session_id = :session_id 
               AND image_id = :image_id`,
            {
                status: "completed",
                user_id,
                session_id,
                image_id
            },
            { autoCommit: true }
        );
        console.log(`Updated database status for key: ${s3Key}. Rows affected: ${result.rowsAffected}`);
    } catch (dbErr) {
        console.error(`Database error while updating key ${s3Key}:`, dbErr.message);
        throw dbErr;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error closing database connection in worker:", closeErr.message);
            }
        }
    }
}
async function handleMessage(message) {
    try {
        const body = JSON.parse(message.Body);
        let records = [];
        if (body.Records) {
            records = body.Records;
        } else if (body.Message) {
            const innerMessage = JSON.parse(body.Message);
            if (innerMessage.Records) {
                records = innerMessage.Records;
            }
        }
        for (const record of records) {
            if (record.s3) {
                await processS3Record(record);
            }
        }
        await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle
        }));
        console.log(`Successfully processed and deleted message: ${message.MessageId}`);
    } catch (err) {
        console.error(`Failed to process message ${message.MessageId}:`, err.message);
    }
}
async function startWorker() {
    if (!queueUrl) {
        console.error("SQS_QUEUE_URL is not defined in the environment.");
        process.exit(1);
    }
    console.log(`Worker started. Polling queue: ${queueUrl}`);
    while (true) {
        try {
            const data = await sqsClient.send(new ReceiveMessageCommand({
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20
            }));
            if (data.Messages && data.Messages.length > 0) {
                console.log(`Received ${data.Messages.length} messages.`);
                for (const message of data.Messages) {
                    await handleMessage(message);
                }
            }
        } catch (pollErr) {
            console.error("Error polling SQS queue:", pollErr.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
startWorker();
