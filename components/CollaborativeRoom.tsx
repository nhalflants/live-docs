"use client"

import React, { useEffect, useRef, useState } from "react"
import Header from "@/components/Header"
import { Editor } from "@/components/editor/Editor"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense"
import ActiveCollaborators from "./ActiveCollaborators"
import { Input } from "./ui/input"
import { currentUser } from "@clerk/nextjs/server"
import Image from "next/image"
import { updateDocument } from "@/lib/actions/room.actions"
import Loader from "./Loader"
import ShareModal from "./ShareModal"

const CollaborativeRoom = ({
  roomId,
  roomMetadata,
  users,
  currentUserType,
}: CollaborativeRoomProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [documentTitle, setDocumentTitle] = useState(roomMetadata.title)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsEditing(false)
        updateDocument(roomId, documentTitle)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [roomId, documentTitle])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const updateTitleHandler = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      setIsLoading(true)

      try {
        if (documentTitle !== roomMetadata.title) {
          const updatedDocument = await updateDocument(roomId, documentTitle)

          if (updatedDocument) {
            setIsEditing(false)
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense fallback={<Loader />}>
        <div className="collaborative-room">
          <Header>
            <div
              ref={containerRef}
              className="flex w-fit items-center justify-center gap-2"
            >
              {isEditing && !isLoading ? (
                <Input
                  type="text"
                  value={documentTitle}
                  ref={inputRef}
                  placeholder="Enter title"
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  onKeyDown={updateTitleHandler}
                  disable={!isEditing}
                  className="document-title-input"
                />
              ) : (
                <p className="document-title">{documentTitle}</p>
              )}

              {currentUserType === "editor" && !isEditing && (
                <Image
                  src="/assets/icons/edit.svg"
                  alt="edit"
                  width={24}
                  height={24}
                  onClick={() => setIsEditing(true)}
                  className="pointer"
                />
              )}

              {currentUserType !== "editor" && !isEditing && (
                <p className="view-only-tag">View only</p>
              )}

              {isLoading && <p className="text-sm text-gray-400">saving...</p>}
            </div>
            <div className="flex flex-1 w-full justify-end gap-2">
              <ActiveCollaborators />
              <ShareModal
                roomId={roomId}
                collaborators={users}
                creatorId={roomMetadata.creatorId}
                currentUserType={currentUserType}
              />
            </div>
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </Header>
          <Editor roomId={roomId} currentUserType={currentUserType} />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  )
}

export default CollaborativeRoom
