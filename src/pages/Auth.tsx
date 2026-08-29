import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { toast } from "@/hooks/use-toast";

import {
  GraduationCap,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";

import { z } from "zod";


const emailSchema =
  z.string()
    .trim()
    .email({
      message: "Invalid email address",
    })
    .max(255);


const passwordSchema =
  z.string()
    .min(6,{
      message:"Password must be at least 6 characters",
    })
    .max(100);



const Auth = () => {


  const navigate = useNavigate();


  const {
    user,
    accessProfile,
    accessProfileLoading,
    signUp,
    signIn,
    signInWithGoogle,
    loading:authLoading,
  } = useAuth();



  const [isLoading,setIsLoading] =
    useState(false);


  const [email,setEmail] =
    useState("");

  const [password,setPassword] =
    useState("");

  const [confirmPassword,setConfirmPassword] =
    useState("");





  useEffect(()=>{


    if(authLoading || !user){
      return;
    }


    /*
     * IMPORTANT:
     *
     * Do not redirect while the real
     * user_access profile is still loading.
     *
     * Otherwise an admin can temporarily
     * receive the safe "user" fallback and
     * get sent to the normal dashboard.
     */

    if(accessProfileLoading){
      return;
    }


    if(!accessProfile){
      return;
    }


    if(!accessProfile.is_active){

      navigate("/access-denied");
      return;

    }



    if(accessProfile.role==="admin"){

      navigate("/admin-dashboard");
      return;

    }



    navigate("/");


  },[
    user,
    accessProfile,
    accessProfileLoading,
    authLoading,
    navigate
  ]);






  const handleSignIn =
    async(e:React.FormEvent)=>{


      e.preventDefault();



      const emailCheck =
        emailSchema.safeParse(email);



      if(!emailCheck.success){

        toast({

          title:"Invalid email",

          description:
          emailCheck.error.errors[0].message,

          variant:"destructive",

        });

        return;

      }





      const passwordCheck =
        passwordSchema.safeParse(password);



      if(!passwordCheck.success){

        toast({

          title:"Invalid password",

          description:
          passwordCheck.error.errors[0].message,

          variant:"destructive",

        });

        return;

      }





      setIsLoading(true);



      const {
        error
      } =
      await signIn(
        email,
        password
      );



      setIsLoading(false);




      if(error){


        if(
          error.message
          .toLowerCase()
          .includes("email not confirmed")
        ){

          toast({

            title:"Email not verified",

            description:
            "Please verify your email before signing in.",

            variant:"destructive",

          });


        }
        else{


          toast({

            title:"Sign in failed",

            description:error.message,

            variant:"destructive",

          });

        }


        return;

      }



      /*
       * Do not navigate here.
       *
       * AuthProvider is loading the real access
       * profile. The useEffect above will route
       * the user once the role is known.
       */

      toast({

        title:"Welcome back!",

        description:
        "Signed in successfully.",

      });

    };






  const handleSignUp =
    async(e:React.FormEvent)=>{


      e.preventDefault();



      const emailCheck =
      emailSchema.safeParse(email);



      if(!emailCheck.success){

        toast({

          title:"Invalid email",

          description:
          emailCheck.error.errors[0].message,

          variant:"destructive",

        });

        return;

      }





      const passwordCheck =
      passwordSchema.safeParse(password);



      if(!passwordCheck.success){

        toast({

          title:"Invalid password",

          description:
          passwordCheck.error.errors[0].message,

          variant:"destructive",

        });

        return;

      }





      if(password!==confirmPassword){

        toast({

          title:"Passwords don't match",

          description:
          "Please make sure both passwords are the same.",

          variant:"destructive",

        });

        return;

      }





      setIsLoading(true);



      const {
        error
      } =
      await signUp(
        email,
        password
      );



      setIsLoading(false);




      if(error){


        toast({

          title:"Sign up failed",

          description:error.message,

          variant:"destructive",

        });


        return;

      }





      toast({

        title:"Check your email",

        description:
        "Verification link sent. Verify your email, then return to Classmate Companion and sign in.",

      });


    };






  const handleGoogleSignIn =
    async()=>{


      setIsLoading(true);



      const {
        error
      } =
      await signInWithGoogle();



      setIsLoading(false);



      if(error){

        toast({

          title:"Google sign in failed",

          description:error.message,

          variant:"destructive",

        });

      }


    };






  if(authLoading){

    return(

      <div className="min-h-screen flex items-center justify-center bg-background">

        <Loader2 className="h-8 w-8 animate-spin text-primary"/>

      </div>

    );

  }






  if(user && accessProfileLoading){

    return(

      <div className="min-h-screen flex items-center justify-center bg-background">

        <Loader2 className="h-8 w-8 animate-spin text-primary"/>

      </div>

    );

  }






  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">

      <Card className="w-full max-w-md">

        <CardHeader className="text-center">

          <div className="flex justify-center mb-4">

            <div className="p-3 rounded-full bg-primary/10">

              <GraduationCap className="h-8 w-8 text-primary"/>

            </div>

          </div>


          <CardTitle className="text-2xl">
            School Grading System
          </CardTitle>


          <CardDescription>
            Sign in to access your teacher dashboard
          </CardDescription>


        </CardHeader>



        <CardContent>


          <Tabs defaultValue="signin">


            <TabsList className="grid w-full grid-cols-2">

              <TabsTrigger value="signin">
                Sign In
              </TabsTrigger>


              <TabsTrigger value="signup">
                Sign Up
              </TabsTrigger>


            </TabsList>




            <TabsContent value="signin">


              <form
                onSubmit={handleSignIn}
                className="space-y-4"
              >


                <div className="space-y-2">

                  <Label>Email</Label>

                  <div className="relative">

                    <Mail className="absolute left-3 top-3 h-4 w-4"/>

                    <Input
                      className="pl-10"
                      type="email"
                      value={email}
                      onChange={
                        e=>setEmail(e.target.value)
                      }
                      required
                    />

                  </div>

                </div>





                <div className="space-y-2">

                  <Label>Password</Label>

                  <div className="relative">

                    <Lock className="absolute left-3 top-3 h-4 w-4"/>


                    <Input

                      className="pl-10"

                      type="password"

                      value={password}

                      onChange={
                        e=>setPassword(e.target.value)
                      }

                      required

                    />

                  </div>

                </div>




                <Button
                  className="w-full"
                  disabled={isLoading}
                >

                  {
                    isLoading &&
                    <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                  }

                  Sign In

                </Button>



              </form>


            </TabsContent>




            <TabsContent value="signup">


              <form
                onSubmit={handleSignUp}
                className="space-y-4"
              >

                <Input
                  placeholder="Email"
                  value={email}
                  onChange={
                    e=>setEmail(e.target.value)
                  }
                />


                <Input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={
                    e=>setPassword(e.target.value)
                  }
                />


                <Input
                  placeholder="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={
                    e=>setConfirmPassword(e.target.value)
                  }
                />



                <Button
                  className="w-full"
                  disabled={isLoading}
                >

                  Create Account

                </Button>


              </form>


            </TabsContent>


          </Tabs>





          <Button
            variant="outline"
            className="w-full mt-6"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >

            Continue with Google

          </Button>



        </CardContent>


      </Card>


    </div>

  );

};


export default Auth;