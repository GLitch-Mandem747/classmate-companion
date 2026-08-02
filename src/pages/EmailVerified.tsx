import { CheckCircle } from "lucide-react";

const EmailVerified = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">

        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-5">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
        </div>


        <h1 className="text-3xl font-bold">
          Email verified successfully
        </h1>


        <p className="text-muted-foreground text-lg">
          Your email has been confirmed.
        </p>


        <p className="text-muted-foreground">
          You can now close this browser tab and return to the
          Classmate Companion desktop application to sign in.
        </p>


      </div>
    </div>
  );
};


export default EmailVerified;