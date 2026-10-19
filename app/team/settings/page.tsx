"use client";
import { OrganizationList } from "@clerk/nextjs";
export default function TeamSettingsPage() {
  return (
    <div className="info-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">A PLACE FOR SHARED CURIOSITY</span>
          <h1>
            Better ideas, <em>together.</em>
          </h1>
          <p>
            Manage your Clerk organizations. Team document access depends on
            your connected service.
          </p>
        </div>
      </div>
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
      />
    </div>
  );
}
