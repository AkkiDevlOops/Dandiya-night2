"use client";
import MyProfile from '@/components/myprofile/MyProfile'
import React, { useEffect } from 'react'
import Background from '@/components/matchingpage/backgroundblur'
import { useAuth } from '@/lib/gettoken';

const page = () => {
 
  return (
    <div>
      <MyProfile/>
      <Background/>
      <div></div>
    </div>
  )
}

export default page
