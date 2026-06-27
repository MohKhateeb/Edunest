import { claimLiveRequest } from "./lib/actions/tutoring-requests/instant-book";

async function testClaim() {
	// We need a mock request
	const reqId = "fake-req-id";
	try {
		const res = await claimLiveRequest(reqId);
		console.log(res);
	} catch (err) {
		console.error(err);
	}
}
testClaim();
