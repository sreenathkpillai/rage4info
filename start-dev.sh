#!/bin/bash

# Care Resource Hub v2 - Development Startup Script

echo "🚀 Starting Care Resource Hub v2 Development Environment"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the v2 directory"
    exit 1
fi

# Check for required tools
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "npm $(npm -v) found"

# Function to setup environment files
setup_env_files() {
    print_status "Setting up environment files..."

    # Client environment
    if [ ! -f "client/.env" ]; then
        if [ -f "client/.env.example" ]; then
            cp client/.env.example client/.env
            print_success "Created client/.env from example"
        else
            print_warning "client/.env.example not found, creating default"
            cat > client/.env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_TINYMCE_API_KEY=n0f2s874rmn85hrrfw88rvv34rjelbp19avlarqf2u41m8u4
VITE_APP_TITLE=Care Resource Hub
VITE_APP_VERSION=2.0.0
EOF
        fi
    fi

    # Server environment
    if [ ! -f "server/.env" ]; then
        if [ -f "server/.env.example" ]; then
            cp server/.env.example server/.env
            print_success "Created server/.env from example"
        else
            print_warning "server/.env.example not found, creating default"
            cat > server/.env << EOF
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/care-resource-hub
JWT_SECRET=development-jwt-secret-change-in-production-minimum-32-chars
CLIENT_URL=http://localhost:5173
EOF
        fi
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    if npm install; then
        print_success "Client dependencies installed"
    else
        print_error "Failed to install client dependencies"
        exit 1
    fi
    cd ..

    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    if npm install; then
        print_success "Server dependencies installed"
    else
        print_error "Failed to install server dependencies"
        exit 1
    fi
    cd ..
}

# Function to run tests
run_tests() {
    print_status "Running comprehensive test suite..."
    if node test-runner.js; then
        print_success "All tests passed! 🎉"
    else
        print_warning "Some tests failed. Check output above for details."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Aborting startup"
            exit 1
        fi
    fi
}

# Function to start development servers
start_servers() {
    print_status "Starting development servers..."

    # Check if MongoDB is running (if using local MongoDB)
    if command -v mongod &> /dev/null; then
        if ! pgrep -x "mongod" > /dev/null; then
            print_warning "MongoDB is not running. Starting MongoDB..."
            if command -v brew &> /dev/null; then
                # macOS with Homebrew
                brew services start mongodb-community
            elif command -v systemctl &> /dev/null; then
                # Linux with systemctl
                sudo systemctl start mongod
            else
                print_warning "Please start MongoDB manually"
            fi
        fi
    fi

    print_success "Environment setup complete!"
    echo
    echo "🎯 Development servers will start in separate terminals:"
    echo "   📱 Frontend: http://localhost:5173"
    echo "   🔧 Backend:  http://localhost:3001"
    echo "   👨‍💼 Admin:    http://localhost:5173/admin"
    echo
    echo "📝 Admin credentials:"
    echo "   Email:    admin@care.com"
    echo "   Password: admin123"
    echo
    echo "🛠️  Starting servers..."

    # Start backend server
    print_status "Starting backend server (Terminal 1)..."
    osascript -e "tell app \"Terminal\" to do script \"cd '$(pwd)/server' && npm run dev\""

    # Wait a moment for backend to start
    sleep 3

    # Start frontend server
    print_status "Starting frontend server (Terminal 2)..."
    osascript -e "tell app \"Terminal\" to do script \"cd '$(pwd)/client' && npm run dev\""

    print_success "Development environment started!"
    echo
    echo "🎉 Care Resource Hub v2 is now running!"
    echo "   Open http://localhost:5173 in your browser"
    echo
    echo "🔍 To monitor:"
    echo "   Backend logs: Check Terminal 1"
    echo "   Frontend logs: Check Terminal 2"
    echo "   API health: curl http://localhost:3001/api/health"
    echo
    echo "🛑 To stop servers:"
    echo "   Press Ctrl+C in both terminal windows"
    echo "   Or run: pkill -f 'npm run dev'"
}

# Parse command line arguments
SKIP_DEPS=false
SKIP_TESTS=false
DOCKER_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --docker)
            DOCKER_MODE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-deps    Skip dependency installation"
            echo "  --skip-tests   Skip test suite"
            echo "  --docker       Use Docker Compose instead"
            echo "  -h, --help     Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Docker mode
if [ "$DOCKER_MODE" = true ]; then
    print_status "Starting with Docker Compose..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
        print_success "Started with Docker Compose"
        print_status "Services available at:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:3001"
        echo "   MongoDB:  mongodb://localhost:27017"
        print_status "View logs: docker-compose logs -f"
        print_status "Stop services: docker-compose down"
    else
        print_error "Docker Compose not found"
        exit 1
    fi
    exit 0
fi

# Main execution flow
setup_env_files

if [ "$SKIP_DEPS" = false ]; then
    install_dependencies
fi

if [ "$SKIP_TESTS" = false ]; then
    run_tests
fi

start_servers