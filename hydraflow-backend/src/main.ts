import 'reflect-metadata';
import './load-env';
import { createNestApp, listenNestApp } from './nest-app';

async function bootstrap() {
  const app = await createNestApp();
  await listenNestApp(app);
}

void bootstrap();
