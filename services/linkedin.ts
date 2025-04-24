import axios from "axios";
import { config } from "../config";

export async function sharePostOnLinkedIn(text: string) {
  const body = {
    author: config.AUTHOR_URN,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  try {
    const response = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      body,
      {
        headers: {
          Authorization: `Bearer ${config.LINKEDIN_ACCESS_TOKEN}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Paylaşım başarılı:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("❌ Paylaşım hatası:", err.response?.data || err.message);
  }
}
