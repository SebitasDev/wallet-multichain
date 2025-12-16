export interface NotificationData {
    chainOrigen: string;
    chainDestino: string;
    amountSend: string;
    asset: string;
    txHash: string;
    emailSender: string;
}

export interface NotificationResult {
    title: string;
    body: string;
    html: string;
    type: "deposit_success";
    data: NotificationData;
}

export function depositSuccessTemplate(data: NotificationData): NotificationResult {
    const { chainOrigen, chainDestino, amountSend, asset, txHash } = data;

    const title = "¡Depósito Completado! 🚀";

    const body = `
        Tu tx ${txHash} por un monto de $${amountSend} ${asset} fue procesada correctamente, desde ${chainOrigen} hacia ${chainDestino}
        
        Mirar en el explorer ${chainOrigen.toLowerCase()}.org/${txHash}
        
        Ya puedes regresar a la wallet e interactuar con tus ${asset} en ${chainDestino}
    `.trim();

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Depósito Completado</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    </head>
    <body style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; margin-top: 40px; margin-bottom: 40px;">
            <div style="background-color: #ffffff; border: 3px solid #000000; box-shadow: 8px 8px 0px #000000; border-radius: 16px; overflow: hidden; margin: 0 20px;">
                <div style="background-color: #7852FF; border-bottom: 3px solid #000000; padding: 15px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 900; letter-spacing: -0.5px;">1LLET</h1>
                </div>

                <div style="padding: 25px 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="display: inline-block; width: 32px; height: 32px; line-height: 32px; background-color: #00DC8C; color: #000000; border-radius: 50%; margin-bottom: 10px; border: 3px solid #000000; box-shadow: 2px 2px 0px #000000; text-align: center;">
                           <span style="font-size: 16px; font-weight: 800; display: inline-block; vertical-align: middle; line-height: normal;">✓</span>
                        </div>
                        <h2 style="color: #000000; margin: 0; font-size: 18px; font-weight: 900;">¡Depósito Exitoso!</h2>
                        <p style="color: #666666; font-size: 12px; font-weight: 600; margin-top: 5px;">Tu transacción ha sido confirmada.</p>
                    </div>

                    <div style="background-color: #ffffff; border: 3px solid #000000; border-radius: 12px; padding: 0; margin-bottom: 20px; box-shadow: 4px 4px 0px #000000;">
                        <div style="padding: 12px; text-align: center; border-bottom: 3px solid #000000; background-color: #f9fafb; border-radius: 9px 9px 0 0;">
                            <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #666666;">Monto Recibido</p>
                            <p style="margin: 2px 0 0 0; font-size: 26px; font-weight: 900; color: #000000;">$${amountSend}</p>
                            <span style="display: inline-block; background-color: #000000; color: #ffffff; padding: 2px 6px; border-radius: 999px; font-weight: 700; font-size: 10px; margin-top: 4px;">${asset}</span>
                        </div>

                        <div style="display: flex; padding: 12px;">
                            <div style="width: 50%; text-align: center; border-right: 3px solid #000000;">
                                <p style="margin: 0; font-size: 9px; font-weight: 700; color: #666666; text-transform: uppercase;">Desde</p>
                                <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 800; color: #000000;">${chainOrigen}</p>
                            </div>
                            <div style="width: 50%; text-align: center;">
                                <p style="margin: 0; font-size: 9px; font-weight: 700; color: #666666; text-transform: uppercase;">Hacia</p>
                                <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 800; color: #000000;">${chainDestino}</p>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: center;">
                        <a href="https://${chainOrigen.toLowerCase()}.org/${txHash}" style="display: inline-block; background-color: #7852FF; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: 900; font-size: 12px; border-radius: 8px; border: 3px solid #000000; box-shadow: 3px 3px 0px #000000; transition: all 0.2s;">
                            Ver en Explorer
                        </a>
                        <p style="margin-top: 12px; font-size: 9px; font-weight: 700; color: #999999; text-transform: uppercase;">
                            Tx Hash: ${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}
                        </p>
                    </div>
                </div>

                <div style="background-color: #000000; padding: 10px; text-align: center;">
                    <p style="margin: 0; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase;">1llet @2025</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return {
        title,
        body,
        html,
        type: "deposit_success",
        data,
    };
}
