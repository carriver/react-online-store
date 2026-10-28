import { Link } from 'react-router';
import './Landing.css';

function Landing() {
  return (
    <div className='main'>
      <h1 className='title'>Welcome to your favorite Fake Online Store!</h1>
      <Link to='/store' className='main-button'>
        <span>Click here to start shopping</span>
      </Link>
    </div>
  );
}

export default Landing;
