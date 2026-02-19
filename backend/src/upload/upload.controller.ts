import { Controller, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const uploadDir = process.env.UPLOAD_DIR || 'uploads';

@Controller('upload')
export class UploadController {
  @Post('proposal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: `./${uploadDir}/proposals`,
        filename: (_, file, cb) => {
          const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(file.originalname || '');
          cb(null, name);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadProposal(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { path: null };
    return { path: `/uploads/proposals/${file.filename}` };
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin', 'system_admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: `./${uploadDir}/avatars`,
        filename: (_, file, cb) => {
          const ext = extname(file.originalname || '').toLowerCase() || '.jpg';
          const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
          cb(null, name);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { path: null };
    return { path: `/uploads/avatars/${file.filename}` };
  }
}
