export function Chat(): string {
    return `
        <div class="chat-container">
            <h1>Chat en Tiempo Real</h1>
            
            <!-- Sección para enviar mensajes -->
            <div class="chat-section">
                <h3>Enviar Mensaje</h3>
                <form id="message-form">
                    <input type="number" id="recipient-id" placeholder="ID del destinatario" required />
                    <input type="text" id="message-content" placeholder="Escribe tu mensaje..." required />
                    <button type="submit">Enviar</button>
                </form>
                <div id="message-result"></div>
            </div>

            <!-- Sección para ver conversaciones -->
            <div class="chat-section">
                <h3>Mis Conversaciones</h3>
                <button id="load-conversations">Cargar Conversaciones</button>
                <div id="conversations-list"></div>
            </div>
        </div>
        
        <style>
            .chat-container {
                max-width: 800px;
                margin: 20px auto;
                padding: 20px;
            }
            
            .chat-section {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #ccc;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            
            #message-form {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            #message-form input {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 3px;
            }
            
            #recipient-id {
                width: 150px;
            }
            
            #message-content {
                flex: 1;
            }
            
            #message-form button {
                padding: 8px 15px;
                background-color: #007cba;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            
            #load-conversations {
                padding: 10px 20px;
                background-color: #28a745;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                margin-bottom: 15px;
            }
            
            #conversations-list {
                margin-top: 10px;
            }
            
            .conversation {
                padding: 10px;
                margin: 5px 0;
                background: #f5f5f5;
                border-radius: 3px;
                border-left: 4px solid #007cba;
            }
            
            #message-result {
                margin-top: 10px;
                padding: 10px;
                border-radius: 3px;
            }
        </style>
    `;
}