"use client";

import dynamic from "next/dynamic";

const JitsiMeetingRoomWrapper = dynamic(() => import("./JitsiMeetingRoom"), {
	ssr: false,
});

export default JitsiMeetingRoomWrapper;
