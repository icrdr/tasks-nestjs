import config from "@/config";
import { ConfigModule } from "@nestjs/config";

export const configModule = ConfigModule.forRoot({
  load: [
    () => {
      return config;
    },
  ],
  isGlobal: true,
});
