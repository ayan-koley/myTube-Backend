class ApiError extends Error {
    constructor(
        statusCode,
        messaeg = "Something went wrong",
        errors=[],
        stack
    ){
        super(messaeg);
        this.statusCode = statusCode;
        this.message = messaeg;
        this.errors = errors;
        this.data = null;
        this.success = false;
        if(stack) {
            this.stack = stack;
        }   else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export {ApiError}