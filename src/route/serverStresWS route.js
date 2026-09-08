import serverPlayerWS from "../controller/streaming/serverWS logic.js";

export default function serverPlayerWSRoute(wss) {

    // new websocket connection
    wss.on("connection", (ws, req) => {

        serverPlayerWS.add(req, ws);

    });

}