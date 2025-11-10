/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { IsUUID } from "class-validator";

export class ApproveOrderDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    orderId: string;
    @IsString()
    @IsNotEmpty()
    metodo: string;
    @IsString()
    @IsNotEmpty()
    email: string;
    @IsString()
    @IsNotEmpty()
    cuil: string;
    @IsOptional()
    @IsNumber()
    numeroOperacion: number;
    @IsOptional()
    @IsString()
    idComprobante:string
}