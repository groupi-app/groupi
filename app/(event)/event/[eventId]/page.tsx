import { PostCard } from "@/components/post-card";
import { UserInfo } from "@/types";

export default async function Page({ params }) {
  const { eventId } = params;
  const userInfo: UserInfo = {
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    avatar: "https://i.pravatar.cc/150?img=68",
  };

  return (
    <div className="container py-12">
      <div className="w-full flex flex-col items-center gap-3">
        <PostCard userInfo={userInfo} />
        <PostCard userInfo={userInfo} />
        <PostCard userInfo={userInfo} />
        <PostCard userInfo={userInfo} />
      </div>
    </div>
  );
}
