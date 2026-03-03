import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCheckoutDto {
    @ApiPropertyOptional({
        description: 'Optional Stripe Price ID override. Uses default from env if not provided.',
        example: 'price_1Abc123...',
    })
    @IsOptional()
    @IsString()
    priceId?: string;
}
