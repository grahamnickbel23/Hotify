export default class serverPlayerWS {

    // connected websocket clients
    static clients = new Set();


    // add new websocket client
    static add(req, ws) {

        serverPlayerWS.clients.add(ws);

        ws.on("close", () => {
            serverPlayerWS.clients.delete(ws);
        });
    }


    // send data to all connected clients
    static broadcast(data) {

        const message = JSON.stringify(data);

        for (const ws of serverPlayerWS.clients) {

            if (ws.readyState === 1) {
                ws.send(message);
            }
        }
    }
}