
import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as fs from 'fs';

const app = express();
let reqMap:  any;

try {  
    const data = fs.readFileSync('config.txt', 'utf8');
    reqMap = {};

    const requests = data.split("\n");
    for(const req of requests){
        const line = req.split('##');
        try{
            reqMap[JSON.stringify(JSON.parse(line[0]))] = line[1];
        } catch(e){
            reqMap[line[0]] = line[1];
        }
    }
} catch(e) {
    console.log('Error:', e.stack);
}

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (request: string) => {
        try{
            if(request.startsWith('150')){
                if(request.length>150){
                    ws.send(reqMap['auth1']); 
                } else {
                    ws.send(reqMap['auth2']); 
                }
            } else{
                const requestString = JSON.stringify(JSON.parse(request));
                if(reqMap[requestString]){
                    ws.send(reqMap[requestString]); 
                } else {
                    const requestJSON = JSON.parse(request);
                    const responseForMT = reqMap[requestJSON.MT];
                    if(responseForMT){
                        ws.send(responseForMT);
                    } else{
                        ws.send(`Response N/A -> ${requestString}`);
                    }
                }
            }
        }catch(e){
            ws.send(`Invalid Req -> ${request}`);
        }
        console.log('received: %s', request);
    });

    //send immediatly a feedback to the incoming connection    
    ws.send('Connected');
});

//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});