export class CustomError extends Error {
  public statusCode: number;
  public userMessage: string;

  constructor(statusCode: number, message: string, userMessage: string) {
    super(message);
    this.statusCode = statusCode;
    this.userMessage = userMessage;
  }
}
