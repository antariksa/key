import { Request, Response, NextFunction } from 'express';

// Middleware function
export function apiMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.APP_API_MIDDLEWARE === '1') {
    let uri = req.originalUrl.split('?')[0];

    const apiExclusion = getApiExclusion(); // Assuming this is a function that retrieves the exclusions
    const modifiedExclusion = apiExclusion.map(value => value.replace(/\/\{[^}]+\}/, ''));

    let exclusion = modifiedExclusion.includes(uri);
    if (!exclusion) {
      for (const validUri of modifiedExclusion) {
        if (new RegExp(`^${validUri.replace(/\*/g, '.*')}$`).test(uri)) {
          exclusion = true;
          break;
        }
      }
    }

    if (!exclusion) {
      const key = req.header('isilah-key');
      const release = req.header('release');
      if (key) {
        if (release) {
          const param = getParam(key, getPassword(release)); // Assuming getParam and getPassword are implemented

          const serverDate = new Date(new Date().getTime() + 3600 * (parseInt(param.gmt) + new Date().getTimezoneOffset() / 60));
          let releaseDate = new Date(parseInt(release, 10));
          releaseDate = new Date(releaseDate.getTime() + 3600 * (parseInt(param.gmt) + new Date().getTimezoneOffset() / 60));

          const minute = Math.abs(serverDate.getTime() - releaseDate.getTime()) / (1000 * 60);

          if (param.username !== getUsername()) { // Assuming getUsername is implemented
            return res.status(401).json({
              error: "Unauthorized Request",
              message: "You are not authorized, I don't know who you are & what you want but I will find you and finish you!"
            });
          } else if (minute > getExpiredDuration()) { // Assuming getExpiredDuration is implemented
            return res.status(401).json({
              error: "Unauthorized Request, Expired",
              message: "You are not authorized, I don't know who you are & what you want but I will find you and finish you!"
            });
          } else {
            const version = getVersion(param.app) || getVersion(); // Assuming getVersion is implemented
            if (param.version !== version) {
              return res.status(426).json({
                error: "Update client is needed",
                message: `Please update your client version from ${param.version} to ${version}`
              });
            }
          }
        } else {
          return res.status(401).json({
            error: "Unauthorized Request, Invalid Release",
            message: "You are not authorized, I don't know who you are & what you want but I will find you and finish you!"
          });
        }
      } else {
        return res.status(401).json({
          error: "Unauthorized Request, Invalid Key",
          message: "You are not authorized, I don't know who you are & what you want but I will find you and finish you!"
        });
      }
    }
  }
  next();
}

// Dummy implementations of functions assumed to be provided
function getApiExclusion(): string[] {
  return ['/cms/player/download_vcf/*']; // Example exclusion
}

function getParam(key: string, password: string) {
  return {
    gmt: '0',
    username: 'exampleUsername',
    app: 'exampleApp',
    version: '1.0.0'
  };
}

function getPassword(release: string): string {
  return 'examplePassword';
}

function getUsername(): string {
  return 'exampleUsername';
}

function getExpiredDuration(): number {
  return 30; // Example duration in minutes
}

function getVersion(app?: string): string {
  return '1.0.0';
}
