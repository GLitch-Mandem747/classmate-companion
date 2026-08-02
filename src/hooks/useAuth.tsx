/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  User,
  Session,
} from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";


interface UserAccessProfile {

  id: string;

  user_id: string;

  email: string;

  role: "admin" | "user";

  is_active: boolean;

  created_at: string;

  updated_at: string;

}



interface AuthContextType {

  user: User | null;

  session: Session | null;

  accessProfile: UserAccessProfile | null;

  loading: boolean;


  refreshAccessProfile: () => Promise<void>;


  signUp: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null;
  }>;


  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null;
    accessProfile: UserAccessProfile | null;
  }>;


  signInWithGoogle: () => Promise<{
    error: Error | null;
  }>;


  signOut: () => Promise<void>;

}



const AuthContext =
  createContext<AuthContextType | undefined>(undefined);





const getAccessProfileByUserId =
async (
  userId: string
): Promise<UserAccessProfile | null> => {


  const {
    data,
    error,
  } =
  await supabase
    .from("user_access")
    .select("*")
    .eq(
      "user_id",
      userId
    )
    .maybeSingle();



  if(error){

    console.error(
      "Error loading user access profile:",
      error
    );

    return null;

  }



  return data as UserAccessProfile | null;

};







const createUserAccessIfMissing =
async (
  user: User
): Promise<UserAccessProfile | null> => {


  const existing =
    await getAccessProfileByUserId(
      user.id
    );



  if(existing){

    return existing;

  }




  const {
    data,
    error,
  } =
  await supabase
    .from("user_access")
    .insert({

      user_id:user.id,

      email:user.email ?? "",

      role:"user",

      is_active:true,

    })
    .select()
    .single();





  if(error){

    console.error(
      "Failed creating user access:",
      error
    );

    return null;

  }





  return data as UserAccessProfile;

};









export const AuthProvider =
({
  children,
}:{
  children:ReactNode;
})=>{


  const [user,setUser] =
    useState<User | null>(null);


  const [session,setSession] =
    useState<Session | null>(null);


  const [accessProfile,setAccessProfile] =
    useState<UserAccessProfile | null>(null);


  const [loading,setLoading] =
    useState(true);







  const refreshAccessProfile =
  async()=>{


    if(!user){

      setAccessProfile(null);

      return;

    }



    const profile =
      await createUserAccessIfMissing(
        user
      );



    setAccessProfile(profile);

  };









  useEffect(()=>{


    const loadSession =
    async()=>{


      const {
        data:{
          session
        }
      } =
      await supabase.auth.getSession();




      const currentUser =
        session?.user ?? null;



      setSession(session);

      setUser(currentUser);




      if(currentUser){

        const profile =
          await createUserAccessIfMissing(
            currentUser
          );


        setAccessProfile(profile);

      }



      setLoading(false);

    };




    loadSession();






    const {
      data:{
        subscription
      }
    } =
    supabase.auth.onAuthStateChange(
      async(
        _event,
        newSession
      )=>{


        const currentUser =
          newSession?.user ?? null;



        setSession(newSession);

        setUser(currentUser);




        if(currentUser){


          const profile =
            await createUserAccessIfMissing(
              currentUser
            );


          setAccessProfile(profile);


        }
        else{


          setAccessProfile(null);


        }



      }
    );




    return()=>{

      subscription.unsubscribe();

    };


  },[]);









  const signUp =
  async(
    email:string,
    password:string
  )=>{


    const normalizedEmail =
      email
        .trim()
        .toLowerCase();




    const redirectUrl =
      `${window.location.origin}/#/email-verified`;





    const {
      error
    } =
    await supabase.auth.signUp({

      email:normalizedEmail,

      password,

      options:{

        emailRedirectTo:
          redirectUrl,

      },

    });





    return {

      error:
        error
        ? new Error(error.message)
        : null,

    };

  };









  const signIn =
  async(
    email:string,
    password:string
  )=>{


    const normalizedEmail =
      email
        .trim()
        .toLowerCase();




    const {
      data,
      error
    } =
    await supabase.auth.signInWithPassword({

      email:normalizedEmail,

      password,

    });





    if(error){

      return {

        error:
          new Error(error.message),

        accessProfile:null,

      };

    }





    if(!data.user){

      return {

        error:
          new Error(
            "User session could not be created."
          ),

        accessProfile:null,

      };

    }






    const profile =
      await createUserAccessIfMissing(
        data.user
      );



    setAccessProfile(profile);




    return {

      error:null,

      accessProfile:profile,

    };


  };









  const signInWithGoogle =
  async()=>{


    const {
      error
    } =
    await supabase.auth.signInWithOAuth({

      provider:"google",

      options:{

        redirectTo:
          `${window.location.origin}/`,

      },

    });





    return {

      error:
        error
        ? new Error(error.message)
        : null,

    };


  };









  const signOut =
  async()=>{


    await supabase.auth.signOut();



    setUser(null);

    setSession(null);

    setAccessProfile(null);


  };









  return (

    <AuthContext.Provider

      value={{

        user,

        session,

        accessProfile,

        loading,

        refreshAccessProfile,

        signUp,

        signIn,

        signInWithGoogle,

        signOut,

      }}

    >

      {children}

    </AuthContext.Provider>

  );

};









export const useAuth =
()=>{


  const context =
    useContext(
      AuthContext
    );



  if(!context){

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }



  return context;

};