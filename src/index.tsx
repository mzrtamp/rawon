import './index.css';
import ReactDOM from 'react-dom';

function Index() {
    return (
        <div className="flex items-center justify-center min-w-full h-screen dark:bg-gray-900">
            <p className="m-32 text-6xl font-bold dark:text-white">Coming soon!</p>
        </div>
    );
}

ReactDOM.render(<Index />, document.getElementById('root'));
