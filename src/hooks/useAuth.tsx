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

  accessProfileLoading: boolean;

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

  try {

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

  }
  catch(error){

    console.error(
      "Unexpected error loading user access profile:",
      error
    );

    return null;

  }

};









const buildFallbackAccessProfile =
(user: User): UserAccessProfile => ({

  id: user.id,

  user_id: user.id,

  email: user.email ?? "",

  role: "user",

  is_active: true,

  created_at: new Date().toISOString(),

  updated_at: new Date().toISOString(),

});









const createUserAccessIfMissing =
async (
  user: User
): Promise<UserAccessProfile> => {

  const fallbackProfile =
    buildFallbackAccessProfile(
      user
    );


  try {

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

        user_id: user.id,

        email: user.email ?? "",

        role: "user",

        is_active: true,

      })
      .select()
      .single();


    if(error){

      console.error(
        "Failed creating user access:",
        error
      );

      return fallbackProfile;

    }


    return (
      data as UserAccessProfile
    ) ?? fallbackProfile;

  }
  catch(error){

    console.error(
      "Unexpected error creating user access:",
      error
    );

    return fallbackProfile;

  }

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


  const [
    accessProfileLoading,
    setAccessProfileLoading
  ] =
    useState(true);


  const [loading,setLoading] =
    useState(true);









  const refreshAccessProfile =
  async()=>{

    if(!user){

      setAccessProfile(null);

      setAccessProfileLoading(false);

      return;

    }


    setAccessProfileLoading(true);


    const fallbackProfile =
      buildFallbackAccessProfile(
        user
      );


    try {

      const profile =
        await createUserAccessIfMissing(
          user
        );


      setAccessProfile(
        profile
      );

    }
    catch(error){

      console.error(
        "Error refreshing access profile:",
        error
      );

      setAccessProfile(
        fallbackProfile
      );

    }
    finally{

      setAccessProfileLoading(false);

    }

  };









  useEffect(()=>{

    let mounted = true;


    const loadSession =
    async()=>{

      try {

        const {
          data:{
            session
          }
        } =
        await supabase.auth.getSession();


        if(!mounted){

          return;

        }


        const currentUser =
          session?.user ?? null;


        setSession(
          session
        );

        setUser(
          currentUser
        );


        if(currentUser){

          setAccessProfileLoading(true);


          const fallbackProfile =
            buildFallbackAccessProfile(
              currentUser
            );


          /*
           * Keep the fallback internally,
           * but do not allow routing to make
           * decisions until the real profile
           * has been checked.
           */

          setAccessProfile(
            fallbackProfile
          );


          void createUserAccessIfMissing(
            currentUser
          )
            .then((profile)=>{

              if(mounted){

                setAccessProfile(
                  profile
                );

              }

            })
            .catch((error)=>{

              console.error(
                "Access profile unavailable:",
                error
              );

              if(mounted){

                setAccessProfile(
                  fallbackProfile
                );

              }

            })
            .finally(()=>{

              if(mounted){

                setAccessProfileLoading(
                  false
                );

              }

            });

        }
        else{

          setAccessProfile(null);

          setAccessProfileLoading(false);

        }

      }
      catch(error){

        console.error(
          "Error loading Supabase session:",
          error
        );

        if(mounted){

          setAccessProfile(null);

          setAccessProfileLoading(false);

        }

      }
      finally{

        if(mounted){

          setLoading(false);

        }

      }

    };


    loadSession();


    const {
      data:{
        subscription
      }
    } =
    supabase.auth.onAuthStateChange(
      (
        event,
        newSession
      )=>{

        if(!mounted){

          return;

        }


        console.log(
          "Supabase auth event:",
          event
        );


        const currentUser =
          newSession?.user ?? null;


        setSession(
          newSession
        );

        setUser(
          currentUser
        );


        if(currentUser){

          setAccessProfileLoading(true);


          const fallbackProfile =
            buildFallbackAccessProfile(
              currentUser
            );


          setAccessProfile(
            fallbackProfile
          );


          /*
           * Do not await this operation inside
           * the Supabase auth callback.
           */

          void createUserAccessIfMissing(
            currentUser
          )
            .then((profile)=>{

              if(mounted){

                setAccessProfile(
                  profile
                );

              }

            })
            .catch((error)=>{

              console.error(
                "Access profile unavailable after auth event:",
                error
              );

              if(mounted){

                setAccessProfile(
                  fallbackProfile
                );

              }

            })
            .finally(()=>{

              if(mounted){

                setAccessProfileLoading(
                  false
                );

              }

            });

        }
        else{

          setAccessProfile(null);

          setAccessProfileLoading(false);

        }

      }
    );


    return()=>{

      mounted = false;

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


    console.log(
      "Attempting Supabase sign-in for:",
      normalizedEmail
    );


    const {
      data,
      error
    } =
    await supabase.auth.signInWithPassword({

      email:normalizedEmail,

      password,

    });


    if(error){

      console.error(
        "SUPABASE SIGN-IN ERROR:",
        error
      );

      console.error(
        "SUPABASE SIGN-IN ERROR CODE:",
        error.code
      );

      console.error(
        "SUPABASE SIGN-IN ERROR STATUS:",
        error.status
      );

      return {

        error:
          new Error(error.message),

        accessProfile:null,

      };

    }


    if(!data.user || !data.session){

      return {

        error:
          new Error(
            "User session could not be created."
          ),

        accessProfile:null,

      };

    }


    /*
     * Authentication succeeded.
     */

    setSession(
      data.session
    );

    setUser(
      data.user
    );


    /*
     * Mark the access profile as loading.
     * Routing must wait until this is finished.
     */

    setAccessProfileLoading(
      true
    );


    const fallbackProfile =
      buildFallbackAccessProfile(
        data.user
      );


    setAccessProfile(
      fallbackProfile
    );


    /*
     * Load the real access profile.
     *
     * Authentication itself is already successful.
     */

    void createUserAccessIfMissing(
      data.user
    )
      .then((profile)=>{

        setAccessProfile(
          profile
        );

      })
      .catch((error)=>{

        console.error(
          "Access profile unavailable after sign-in:",
          error
        );

        setAccessProfile(
          fallbackProfile
        );

      })
      .finally(()=>{

        setAccessProfileLoading(
          false
        );

      });


    /*
     * Do not return the fallback as the final
     * routing decision. The Auth component will
     * wait for accessProfileLoading to finish.
     */

    return {

      error:null,

      accessProfile:null,

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

    setAccessProfileLoading(false);

  };









  return (

    <AuthContext.Provider

      value={{

        user,

        session,

        accessProfile,

        accessProfileLoading,

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