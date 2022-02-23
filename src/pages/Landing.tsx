import { Link } from 'react-router-dom';
import './Landing.css';

function Landing() {
  return (
    <div className='main'>
      <h1 className='title'>Welcome to your favorite Fake Online Store!</h1>
      <button type='submit' className='main-button'>
        <Link to='/store'>
          <span>Click here to start shopping</span>
        </Link>
      </button>
    </div>
  );
}

export default Landing;
