13-jul-2026 23:37

Um i just started this project after the previous system design interaction with my grouip. It seemed to be a nice project to make for using javascript. 
i also found some major flaws in the design (suggested by @afeistel on discord). i had to change the deisng a little bit.

14-jul-2026 22:43

i worked on aws today. managed to configure the stuff. and its working, i had to ultimately decide to change rabbitmq with aws SQS (simple queue service). and wrote worker.js, which will poll on SQS. and the SQS is capable of automatically load balance on the different workers. 

now i am planning on writting the documentation tommorow and then will publish on X ig

