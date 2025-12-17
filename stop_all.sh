#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}Stopping all services...${NC}"

# Stop Python HTTP servers
if [ -f /tmp/l11_pid.txt ]; then
    L11_PID=$(cat /tmp/l11_pid.txt)
    kill $L11_PID 2>/dev/null && echo -e "${GREEN}✓ Stopped L11 (PID: $L11_PID)${NC}" || echo -e "${YELLOW}⚠ L11 not running${NC}"
    rm /tmp/l11_pid.txt
fi

if [ -f /tmp/lab14_pid.txt ]; then
    LAB14_PID=$(cat /tmp/lab14_pid.txt)
    kill $LAB14_PID 2>/dev/null && echo -e "${GREEN}✓ Stopped lab14 (PID: $LAB14_PID)${NC}" || echo -e "${YELLOW}⚠ lab14 not running${NC}"
    rm /tmp/lab14_pid.txt
fi

if [ -f /tmp/lab15_pid.txt ]; then
    LAB15_PID=$(cat /tmp/lab15_pid.txt)
    kill $LAB15_PID 2>/dev/null && echo -e "${GREEN}✓ Stopped lab15 (PID: $LAB15_PID)${NC}" || echo -e "${YELLOW}⚠ lab15 not running${NC}"
    rm /tmp/lab15_pid.txt
fi

if [ -f /tmp/lab16_api_pid.txt ]; then
    LAB16_API_PID=$(cat /tmp/lab16_api_pid.txt)
    kill $LAB16_API_PID 2>/dev/null && echo -e "${GREEN}✓ Stopped lab16 API (PID: $LAB16_API_PID)${NC}" || echo -e "${YELLOW}⚠ lab16 API not running${NC}"
    rm /tmp/lab16_api_pid.txt
fi

if [ -f /tmp/lab16_frontend_pid.txt ]; then
    LAB16_FRONTEND_PID=$(cat /tmp/lab16_frontend_pid.txt)
    kill $LAB16_FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✓ Stopped lab16 Frontend (PID: $LAB16_FRONTEND_PID)${NC}" || echo -e "${YELLOW}⚠ lab16 Frontend not running${NC}"
    rm /tmp/lab16_frontend_pid.txt
fi

# Kill any remaining Python HTTP servers on our ports
pkill -f "python3 -m http.server 8000" 2>/dev/null
pkill -f "python3 -m http.server 8001" 2>/dev/null
pkill -f "python3 -m http.server 8002" 2>/dev/null
pkill -f "python3 -m http.server 8003" 2>/dev/null
pkill -f "python.*app.py" 2>/dev/null

# Stop Docker services
echo -e "${YELLOW}Stopping Docker services...${NC}"

cd lab06 && docker-compose down 2>/dev/null && echo -e "${GREEN}✓ Stopped lab06${NC}" || echo -e "${YELLOW}⚠ lab06 not running${NC}"
cd ../frontend && docker-compose down 2>/dev/null && echo -e "${GREEN}✓ Stopped frontend${NC}" || echo -e "${YELLOW}⚠ frontend not running${NC}"
cd ../lab10 && docker-compose down 2>/dev/null && echo -e "${GREEN}✓ Stopped lab10${NC}" || echo -e "${YELLOW}⚠ lab10 not running${NC}"

echo -e "${GREEN}All services stopped!${NC}"




