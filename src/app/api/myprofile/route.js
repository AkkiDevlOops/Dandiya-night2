// app/api/users/males/route.js
import  connectDB  from '@/lib/db.js';
import  Profile  from '@/models/profile'; // 👈 Import your actual User/Profile model
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { userlog } from '@/models/Registration';

export async function GET() {
  try {
     await connectDB();
      const cookieStore = await cookies();
      const token = cookieStore.get('session')?.value;

      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
           
            // 3. Verify and decode the token payload
            const { payload } = await jwtVerify(token, secret);
          
            const email = payload.email;
            
                   const user = await userlog.findOne({
                    email: email,
                  })
                 
                   const userToken = user.tokenDetails
    
     
    // 1. Ensure your app is actively connected to MongoDB
    

    const alreadyusername = await Profile.findOne({ email: email });
    
    console.log(alreadyusername)
   

    // 3. Return the array list to the frontend
    return NextResponse.json({
      success: true,
      users: alreadyusername
    }); }

  catch (error) {
    console.error("Failed to fetch male users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
