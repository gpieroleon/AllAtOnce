import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async countSuperadmins(): Promise<number> {
    return this.prisma.user.count({ where: { role: 'superadmin' } });
  }

  list() {
    // Solo el equipo: los clientes se gestionan en /admin/clients
    return this.prisma.user.findMany({
      where: { role: { in: ['admin', 'superadmin'] } },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        reg: true,
      },
    });
  }

  async create(data: {
    name: string;
    email: string;
    role: string;
    password: string;
    phone?: string;
  }) {
    const email = data.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing)
      throw new ConflictException('Ya existe un usuario con ese email');
    return this.prisma.user.create({
      data: {
        name: data.name,
        email,
        role: data.role,
        phone: data.phone,
        password: await bcrypt.hash(data.password, 10),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        reg: true,
      },
    });
  }

  async updateRole(email: string, role: string, actorEmail: string) {
    const target = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    if (target.role === 'superadmin' && role !== 'superadmin') {
      if (target.email === actorEmail) {
        throw new ForbiddenException('No puedes degradar tu propio rol');
      }
      if ((await this.countSuperadmins()) <= 1) {
        throw new BadRequestException(
          'No se puede degradar al último superadmin',
        );
      }
    }
    const user = await this.prisma.user.update({
      where: { email: target.email },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        reg: true,
      },
    });
    return user;
  }

  async remove(email: string, actorEmail: string) {
    const target = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');
    if (target.email === actorEmail) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }
    if (target.role === 'superadmin' && (await this.countSuperadmins()) <= 1) {
      throw new BadRequestException(
        'No se puede eliminar al último superadmin',
      );
    }
    await this.prisma.user.delete({ where: { email: target.email } });
    return { deleted: true };
  }
}
