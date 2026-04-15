import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h3M8 2v3M8 11v3M14 8h-3M5 5l2 2M11 5l-2 2M5 11l2-2M11 11l-2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">NextFlow</span>
          </div>
          <p className="text-sm text-[#666]">LLM Workflow Builder</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[#161616] border border-[#2a2a2a] shadow-2xl rounded-xl",
              headerTitle: "text-[#e8e8e8] text-lg font-semibold",
              headerSubtitle: "text-[#666] text-sm",
              socialButtonsBlockButton:
                "bg-[#1a1a1a] border border-[#2a2a2a] text-[#e8e8e8] hover:bg-[#222] hover:border-[#3a3a3a] transition-all",
              socialButtonsBlockButtonText: "text-[#e8e8e8] font-medium",
              dividerLine: "bg-[#2a2a2a]",
              dividerText: "text-[#555] text-xs",
              formFieldLabel: "text-[#888] text-xs font-medium",
              formFieldInput:
                "bg-[#0d0d0d] border-[#2a2a2a] text-[#e8e8e8] focus:border-purple-600 focus:ring-purple-600/20 rounded-lg",
              formButtonPrimary:
                "bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all",
              footerActionLink: "text-purple-400 hover:text-purple-300",
              identityPreviewText: "text-[#e8e8e8]",
              identityPreviewEditButton: "text-purple-400",
            },
          }}
        />
      </div>
    </div>
  );
}
