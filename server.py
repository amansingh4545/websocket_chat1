import asyncio
import json
from websockets.legacy.server import serve

import os
PORT = int(os.environ.get("PORT", 12345))

clients = {}
name_to_ws = {} 
monitor_clients = set()

async def broadcast_user_list():
    user_list = list(clients.values())
    msg = json.dumps({ "type": "users", "users": user_list })
    for ws in clients:
        await ws.send(msg)
    for monitor in monitor_clients:
        await monitor.send(msg)

async def handler(websocket):
    path = websocket.path
    if path == "/monitor":
        monitor_clients.add(websocket)
        await websocket.send(json.dumps({ "type": "users", "users": list(clients.values()) }))
        try:
            async for _ in websocket:
                pass
        finally:
            monitor_clients.remove(websocket)
        return

    # First message = username
    name = await websocket.recv()
    if name.lower() in (n.lower() for n in name_to_ws):
        await websocket.send(json.dumps({ "type": "error", "error": "User with this name already exist."}))
        await websocket.close()
        return
    else:

        clients[websocket] = name
        name_to_ws[name] = websocket
        await broadcast_user_list()

        for monitor in monitor_clients:
            await monitor.send(json.dumps({ "type": "join", "msg": f'New user "{name}" has joined'}))

        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get("type") == "file":
                        file_payload = {
                            "type": "file",
                            "from": name,
                            "to": data["to"],
                            "message": data["message"],
                            "filename": data["filename"],
                            "filetype": data["filetype"],
                            "file": data["file"]
                        }
                    elif data.get("type") == "normal_message":
                        file_payload = {
                            "type": data["type"],
                            "from": name,
                            "to": data["to"],
                            "message": data["message"],
                        }

                    await websocket.send(json.dumps(file_payload))
                    for monitor in monitor_clients:
                        await monitor.send(json.dumps(file_payload))
                    for selectedUsers in data["to"]:
                        recipient_name = selectedUsers
                        recipient_ws = name_to_ws.get(recipient_name)
                        if recipient_ws:
                            await recipient_ws.send(json.dumps(file_payload))

                except json.JSONDecodeError:
                    pass

        except Exception as e:
            print(f"Error: {e}")

        finally:
            for monitor in monitor_clients:
                await monitor.send(json.dumps({ "type": "left", "msg": f'User "{name}" has left the chat'}))
            clients.pop(websocket, None)
            name_to_ws.pop(name, None)
            await broadcast_user_list()


async def main():
    async with serve(handler, "0.0.0.0", PORT, max_size = 7 * 1024 * 1024):
        print("WebSocket server running at ws://0.0.0.0:12345")
        while True:
            await asyncio.sleep(1)


asyncio.run(main())
