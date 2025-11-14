import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return API information', () => {
      const result = appController.getApiInfo();
      expect(result).toHaveProperty('name', 'Backend API Service');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('endpoints');
    });
  });
});