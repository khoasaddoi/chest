class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameHistory = [];
        this.gameStatus = 'playing';
        this.initializeGame();
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Black pieces
        board[0] = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
        board[1] = ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'];
        
        // White pieces
        board[6] = ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'];
        board[7] = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
        
        return board;
    }

    initializeGame() {
        this.createBoard();
        this.updateCurrentPlayer();
        this.addEventListeners();
    }

    createBoard() {
        const boardElement = document.getElementById('chess-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                if (this.board[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = 'piece';
                    piece.textContent = this.board[row][col];
                    piece.dataset.piece = this.board[row][col];
                    square.appendChild(piece);
                }
                
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                boardElement.appendChild(square);
            }
        }
    }

    handleSquareClick(row, col) {
        if (this.gameStatus !== 'playing') return;
        
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const piece = this.board[row][col];
        
        if (this.selectedSquare) {
            if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
                // Deselect
                this.clearSelection();
                return;
            }
            
            if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
                this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
                this.clearSelection();
            } else {
                // Select new piece if it belongs to current player
                if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
                    this.selectSquare(row, col);
                } else {
                    this.clearSelection();
                }
            }
        } else {
            // Select piece if it belongs to current player
            if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
                this.selectSquare(row, col);
            }
        }
    }

    selectSquare(row, col) {
        this.clearSelection();
        this.selectedSquare = { row, col };
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('selected');
        
        // Show possible moves
        this.showPossibleMoves(row, col);
    }

    clearSelection() {
        this.selectedSquare = null;
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'possible-move');
        });
    }

    showPossibleMoves(row, col) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    square.classList.add('possible-move');
                }
            }
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];
        
        // Can't move to same position
        if (fromRow === toRow && fromCol === toCol) return false;
        
        // Can't capture own piece
        if (targetPiece && this.isPieceOwnedByCurrentPlayer(targetPiece)) return false;
        
        // Basic piece movement validation
        return this.validatePieceMovement(piece, fromRow, fromCol, toRow, toCol);
    }

    validatePieceMovement(piece, fromRow, fromCol, toRow, toCol) {
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const isWhite = this.isWhitePiece(piece);
        
        switch (piece) {
            case '♙': // White pawn
                if (colDiff === 0 && !this.board[toRow][toCol]) {
                    return rowDiff === -1 || (fromRow === 6 && rowDiff === -2);
                }
                return Math.abs(colDiff) === 1 && rowDiff === -1 && this.board[toRow][toCol];
                
            case '♟': // Black pawn
                if (colDiff === 0 && !this.board[toRow][toCol]) {
                    return rowDiff === 1 || (fromRow === 1 && rowDiff === 2);
                }
                return Math.abs(colDiff) === 1 && rowDiff === 1 && this.board[toRow][toCol];
                
            case '♖': case '♜': // Rook
                return (rowDiff === 0 || colDiff === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol);
                
            case '♗': case '♝': // Bishop
                return Math.abs(rowDiff) === Math.abs(colDiff) && this.isPathClear(fromRow, fromCol, toRow, toCol);
                
            case '♘': case '♞': // Knight
                return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || 
                       (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
                
            case '♕': case '♛': // Queen
                return ((rowDiff === 0 || colDiff === 0) || (Math.abs(rowDiff) === Math.abs(colDiff))) && 
                       this.isPathClear(fromRow, fromCol, toRow, toCol);
                
            case '♔': case '♚': // King
                return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
                
            default:
                return false;
        }
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Save move to history
        this.gameHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece,
            captured: capturedPiece
        });
        
        // Make the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Update display
        this.createBoard();
        this.updateCurrentPlayer();
        this.checkGameStatus();
    }

    isPieceOwnedByCurrentPlayer(piece) {
        const whitePieces = ['♙', '♖', '♘', '♗', '♕', '♔'];
        const blackPieces = ['♟', '♜', '♞', '♝', '♛', '♚'];
        
        if (this.currentPlayer === 'white') {
            return whitePieces.includes(piece);
        } else {
            return blackPieces.includes(piece);
        }
    }

    isWhitePiece(piece) {
        const whitePieces = ['♙', '♖', '♘', '♗', '♕', '♔'];
        return whitePieces.includes(piece);
    }

    updateCurrentPlayer() {
        const playerElement = document.getElementById('current-player');
        playerElement.textContent = `Lượt của: ${this.currentPlayer === 'white' ? 'Trắng' : 'Đen'}`;
    }

    checkGameStatus() {
        // Simple game status check
        const statusElement = document.getElementById('game-status');
        
        if (this.isCheckmate()) {
            this.gameStatus = 'checkmate';
            statusElement.innerHTML = `<p style="color: #d32f2f; font-weight: bold;">Chiếu bí! ${this.currentPlayer === 'white' ? 'Đen' : 'Trắng'} thắng!</p>`;
        } else if (this.isStalemate()) {
            this.gameStatus = 'stalemate';
            statusElement.innerHTML = `<p style="color: #ff9800; font-weight: bold;">Hòa cờ!</p>`;
        } else {
            statusElement.innerHTML = '<p>Chọn quân cờ để tiếp tục</p>';
        }
    }

    isCheckmate() {
        // Simplified checkmate detection
        return false; // Implement full checkmate logic if needed
    }

    isStalemate() {
        // Simplified stalemate detection
        return false; // Implement full stalemate logic if needed
    }

    addEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('undo-move').addEventListener('click', () => {
            this.undoMove();
        });
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameHistory = [];
        this.gameStatus = 'playing';
        this.createBoard();
        this.updateCurrentPlayer();
        document.getElementById('game-status').innerHTML = '<p>Chọn quân cờ để bắt đầu</p>';
    }

    undoMove() {
        if (this.gameHistory.length === 0) return;
        
        const lastMove = this.gameHistory.pop();
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.createBoard();
        this.updateCurrentPlayer();
        this.clearSelection();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});