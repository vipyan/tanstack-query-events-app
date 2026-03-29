import { Link, Outlet } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import Modal from "../UI/Modal.jsx";

import Header from "../Header.jsx";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchEvent, deleteEvent, queryClient } from "../../utils/http.js";
import { useState } from "react";

export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { id } = useParams(); // matches ":id" in the route
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
  });

  const {
    mutate,
    isPending: isDeletingMutationPending,
    isError: isDeletingError,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events"],
        refetchType: "none ",
      });
      navigate("/events");
    },
    
  });

  function handleStartDelete() {
    setIsDeleting(true);
  }
  function handleCancelDelete() {
    setIsDeleting(false);
  }

  function handleDelete() {
    mutate({ id });
  }

  let content;

  // 3. Early returns for loading/error - BEFORE the main return
  if (isPending) {
    content = <div id="event-details-content">Loading...</div>;
  }
  if (isError) {
    content = (
      <div id="event-details-content">
        <ErrorBlock
          title="Failed to load event"
          message={error.info?.message || "Unknown error"}
        />
      </div>
    );
  }

  if (data) {
    const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    content = (
      <>
        <header>
          <h1>{data.title}</h1> {/* replace placeholder here */}
          <nav>
            <button onClick={handleStartDelete}>Delete Event</button>
            <Link to={`edit`} className="button">
              Edit Event
            </Link>
          </nav>
        </header>
        <div id="event-details-content">
          <img src={`http://localhost:3000/${data.image}`} alt={data.title} />
          <div id="event-details-info">
            <p id="event-details-location">{data.location}</p>
            <time dateTime={`${data.date}T${data.time}`}>
              {formattedDate} @ {data.time}
            </time>
            <p id="event-details-description">{data.description}</p>
          </div>
        </div>
      </>
    );
  }

  // 4. Main return - data is guaranteed to exist here
  return (
    <>
      {isDeleting && (
        <Modal onClose={handleCancelDelete}>
          <h2>Are you sure you want to delete this event?</h2>
          <div className="form-actions">
            {isDeletingMutationPending && <p>Deleting...</p>}
            {!isDeletingMutationPending && (
              <>
                <button onClick={handleDelete} className="button-text">
                  Yes, delete
                </button>
                <button onClick={handleCancelDelete} className="button">
                  Cancel
                </button>
              </>
            )}
          </div>
          {isDeletingError && (
            <ErrorBlock
              title="Failed to delete event"
              message={deleteError.info?.message || "Failed to delete event"}
            />
          )}
        </Modal>
      )}
      <Outlet />
      <Header>
        <Link to="/events">Back to Events</Link>
      </Header>
      <article id="event-details">{content}</article>
    </>
  );
}
