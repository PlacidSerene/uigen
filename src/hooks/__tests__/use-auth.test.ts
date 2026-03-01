import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const {
  mockPush,
  mockSignIn,
  mockSignUp,
  mockGetAnonWorkData,
  mockClearAnonWork,
  mockGetProjects,
  mockCreateProject,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignUp: vi.fn(),
  mockGetAnonWorkData: vi.fn(),
  mockClearAnonWork: vi.fn(),
  mockGetProjects: vi.fn(),
  mockCreateProject: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: mockSignIn,
  signUp: mockSignUp,
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: mockGetAnonWorkData,
  clearAnonWork: mockClearAnonWork,
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: mockGetProjects,
}));

vi.mock("@/actions/create-project", () => ({
  createProject: mockCreateProject,
}));

import { useAuth } from "@/hooks/use-auth";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([]);
  });

  describe("initial state", () => {
    test("isLoading is false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signIn", () => {
    test("calls signInAction with provided email and password", async () => {
      mockSignIn.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "mypassword");
      });

      expect(mockSignIn).toHaveBeenCalledWith("user@test.com", "mypassword");
    });

    test("returns the result from signInAction", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
      const { result } = renderHook(() => useAuth());

      let returnValue;
      await act(async () => {
        returnValue = await result.current.signIn("test@example.com", "wrong");
      });

      expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
    });

    test("sets isLoading to false after completion", async () => {
      mockSignIn.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("sets isLoading to false even when signInAction throws", async () => {
      mockSignIn.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password");
        } catch {
          // expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not trigger post-sign-in navigation on failure", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "wrong");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("triggers post-sign-in navigation on success", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([{ id: "proj-1" }]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });
  });

  describe("signUp", () => {
    test("calls signUpAction with provided email and password", async () => {
      mockSignUp.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@test.com", "newpassword");
      });

      expect(mockSignUp).toHaveBeenCalledWith("user@test.com", "newpassword");
    });

    test("returns the result from signUpAction", async () => {
      mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });
      const { result } = renderHook(() => useAuth());

      let returnValue;
      await act(async () => {
        returnValue = await result.current.signUp("existing@example.com", "password");
      });

      expect(returnValue).toEqual({ success: false, error: "Email already registered" });
    });

    test("sets isLoading to false after completion", async () => {
      mockSignUp.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("test@example.com", "password");
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("sets isLoading to false even when signUpAction throws", async () => {
      mockSignUp.mockRejectedValue(new Error("Server error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signUp("test@example.com", "password");
        } catch {
          // expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not trigger post-sign-in navigation on failure", async () => {
      mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("test@example.com", "password");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("triggers post-sign-in navigation on success", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([{ id: "existing-proj" }]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/existing-proj");
    });
  });

  describe("post-sign-in navigation", () => {
    test("saves anon work as a new project and redirects when anon messages exist", async () => {
      const anonData = {
        messages: [{ role: "user", content: "Make a button" }],
        fileSystemData: { "/": { type: "directory" }, "/App.tsx": {} },
      };
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonData);
      mockCreateProject.mockResolvedValue({ id: "anon-proj-123" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonData.messages,
        data: anonData.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-proj-123");
    });

    test("skips fetching existing projects when anon work has messages", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "Build a form" }],
        fileSystemData: {},
      });
      mockCreateProject.mockResolvedValue({ id: "proj-from-anon" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockGetProjects).not.toHaveBeenCalled();
    });

    test("falls through to existing projects when anon messages array is empty", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue([{ id: "existing-proj" }]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/existing-proj");
    });

    test("redirects to the most recent existing project when there is no anon work", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "recent-proj" }, { id: "older-proj" }]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-proj");
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    test("creates a new project and redirects when no anon work and no existing projects", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "brand-new-proj" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/brand-new-proj");
    });
  });
});
