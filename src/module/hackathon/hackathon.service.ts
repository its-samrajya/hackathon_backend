import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { CreateHackathonDto } from './dto/create-hackathon.dto.js';
import { UpdateHackathonDto } from './dto/update-hackathon.dto.js';

@Injectable()
export class HackathonService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateHackathonDto, authorId: string) {
    return this.prisma.hackathon.create({
      data: { ...dto, authorId },
    });
  }

  findAll() {
    return this.prisma.hackathon.findMany({
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  async findOne(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    if (!hackathon) throw new NotFoundException(`Hackathon ${id} not found`);
    return hackathon;
  }

  async update(id: string, dto: UpdateHackathonDto) {
    await this.findOne(id);
    return this.prisma.hackathon.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.hackathon.delete({ where: { id } });
  }

  async join(hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) throw new NotFoundException(`Hackathon ${hackathonId} not found`);
    if (!hackathon.isActive) throw new BadRequestException('Hackathon is not active');
    if (hackathon.endsAt < new Date()) throw new BadRequestException('Hackathon has ended');

    try {
      return await this.prisma.hackathonParticipant.create({
        data: { hackathonId, userId },
        include: {
          hackathon: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });
    } catch {
      throw new BadRequestException('Already joined this hackathon');
    }
  }
}
