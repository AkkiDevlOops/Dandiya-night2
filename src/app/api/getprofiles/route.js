// app/api/users/males/route.js
import  connectDB  from '@/lib/db.js';
import  Profile  from '@/models/profile'; // 👈 Import your actual User/Profile model
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { userlog } from '@/models/Registration';
import { redirect } from 'next/navigation';

export async function POST() {
  try {
      await connectDB();
      const cookieStore = await cookies();
      const token = cookieStore.get("session")?.value;

     
         if (!token) { 
           const loginUrl = new URL('/loginRegister', request.url);
         return NextResponse.redirect(loginUrl);
         }
     
         const secret = new TextEncoder().encode(process.env.JWT_SECRET);
       
           // 3. Verify and decode the token payload
           const { payload } = await jwtVerify(token, secret);
           
            console.log(payload)
            
      const email = payload.email; 
      
           const user = await userlog.findOne({
            email: email,
          })
          
     
    // 1. Ensure your app is actively connected to MongoDB
    

    const alreadyusername = await Profile.findOne({ email: email });
    const gender = alreadyusername.gender;

    
    // 2. 🚀 Filter Query: Find all documents where gender is exactly "male"
    // (Case-insensitive regex matching ensures it catches "Male", "male", or "MALE")
    if(gender == 'Female'){
         const femaleUsers = await Profile.find({
         gender: { $regex: /^female$/i } 
         });

         console.log("female user "+femaleUsers)

         return NextResponse.json({
      success: true,
      count: femaleUsers.length,
      users: femaleUsers
    });
    }

    if(gender == 'Male'){
    const maleUsers = await Profile.find({
      gender: { $regex: /^male$/i } 
    });
   
    console.log("male users"+maleUsers)

    // 3. Return the array list to the frontend
    return NextResponse.json({
      success: true,
      count: maleUsers.length,
      users: maleUsers
    }); }

  } catch (error) {
    console.error("Failed to fetch male users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
