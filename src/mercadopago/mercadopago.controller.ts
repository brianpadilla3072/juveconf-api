/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Body, Controller, HttpCode, Logger, Post, Headers, Req } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';
import { CreatePreferenceDto } from './DTOs/create-preference.dto';
import { JwtService } from 'src/jwt/jwt.service';

@Controller('mercadopago')
export class MercadopagoController {
  private readonly logger = new Logger(MercadopagoController.name);

  constructor(private readonly mpService: MercadopagoService, private readonly jwtService: JwtService) { }

  @Post('preference')
  async createPreference(@Body() dto: CreatePreferenceDto) {
    const initPoint = await this.mpService.createPreference(dto);
    return { initPoint };
  }
  @Post('webhook/payment')
  @HttpCode(200)
  async handleNotification(
    @Req() req: any,
    @Headers('x-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    if (!this.mpService.verify(signature, rawBody)) {
      this.logger.warn('Firma inválida');
    }

    // 2) Extraemos el payment id del payload
    const { data } = JSON.parse(req.rawBody.toString());
    const paymentId = data.id;

    // 3) Consultamos y validamos el pago
    const payment = await this.mpService.getPaymentDetails(paymentId);
    const status = payment.status;

    switch (payment.status) {
      case 'approved':
        try {
          // Verificar y decodificar el token
          const decoded = this.jwtService.verifyMetadata(payment.metadata.token);
          if (decoded) {
            const data = this.jwtService.decodeMetadata(payment.metadata.token);
            console.log(data);

          }


        } catch (error) {
          this.logger.error('Error al verificar el token: ', error.message);
          // Maneja el error según sea necesario
        }
        break;
      case 'pending':
        // Marcar el pedido como pendiente
        break;
      case 'rejected':
        // Notificar al usuario sobre el rechazo
        break;
      // Manejar otros estados según sea necesario
      default:
        this.logger.warn(`Estado de pago no manejado: ${status}`);
    }

    return 'OK';
  }
}
