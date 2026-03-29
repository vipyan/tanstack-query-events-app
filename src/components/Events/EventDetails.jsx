import { Link, Outlet } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import ErrorBlock from '../UI/ErrorBlock.jsx';



import Header from '../Header.jsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import  {fetchEvent, deleteEvent, queryClient} from '../../utils/http.js';

export default function EventDetails() {
  
  const { id } = useParams(); // matches ":id" in the route
  const navigate = useNavigate();


const { data, isPending, isError, error } = useQuery({
  queryKey: ['events', id],
  queryFn: ({ signal }) => fetchEvent({ id, signal }),
});
  
  const {mutate} = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['events'],
        refetchType: 'none ',
      });
      navigate("/events");
    }
  });
  
  function handleDelete() {
    mutate({ id });
    
    
  }
  
  let content

  // 3. Early returns for loading/error - BEFORE the main return
  if (isPending) {
    content = <div id="event-details-content">Loading...</div>;
  }
  if (isError) {
    content = <div id="event-details-content">
      <ErrorBlock title ="Failed to load event" message={error.info?.message || 'Unknown error'} />
    </div>;
  }

  if (data) {
    const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    content =
      <>
      <header>
          <h1>{data.title}</h1>   {/* replace placeholder here */}
          <nav>
            <button onClick={handleDelete}>Delete Event</button>
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
      
  }

  // 4. Main return - data is guaranteed to exist here
  return (
    <>
      <Outlet />
      <Header>...</Header>
      <article id="event-details">
        
       {content}
      </article>
    </>
  );
}