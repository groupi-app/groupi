import MemberIcon from "@/components/member-icon";
import Link from "next/link";

export default function MemberList() {
  const mockUserInfo = {
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    avatar: "https://i.pravatar.cc/150?img=68",
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-heading">Attendees</h2>
        <div className="rounded-full p-[.3rem] flex items-center justify-center text-xs bg-muted text-muted-foreground text-center">
          <span>12</span>
        </div>
      </div>
      <div className="flex items-center p-2 -space-x-2 flex-wrap h-[54px] overflow-hidden">
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
        <MemberIcon userInfo={mockUserInfo} />
      </div>
      <Link href={"/event/id/attendees"}>
        <span className="text-primary hover:underline">View All</span>
      </Link>
    </div>
  );
}
