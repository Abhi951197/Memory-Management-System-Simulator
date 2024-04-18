// Define Process class
function Process(size, time) {
    this.size = size;
    this.timeLeft = time;
    this.allocatedBlock = null;
    this.id = processID;

    processID += 1;

    this.isAllocated = function() {
        return this.allocatedBlock != null;
    };

    this.tick = function() {
        this.timeLeft -= 1;
    };
}

// Define MemControlBlock class
function MemControlBlock(size) {
    this.size = size;
    this.process = null;
    this.available = true;
    this.next = null;
    this.prev = null;
    this.fromPartition = false; // Used to determine whether height of a MemControlBlock needs to be added

    this.setProcess = function(process) {
        if (process == null) {
            this.process = null;
            this.available = true;
        } else {
            this.process = process;
            this.available = false;
        }
    };
}

// Simulates memory
function Heap() {
    this.head = null;
    this.size = 0;

    // Allocate process to memory using best fit method
    this.requestAllocation = function(process) {
        let blockBestFit = null;
        let minSpaceLeftover = Infinity;

        let block = this.head;

        while (block != null) {
            if (block.available && block.size >= process.size) {
                let spaceLeftover = block.size - process.size;
                if (spaceLeftover < minSpaceLeftover) {
                    blockBestFit = block;
                    minSpaceLeftover = spaceLeftover;
                }
            }
            block = block.next;
        }

        if (blockBestFit != null) {
            // Allocate the process to the best-fit block
            if (minSpaceLeftover > memControlBlockSize) {
                // Partition block if needed
                let newBlock = new MemControlBlock(minSpaceLeftover);
                newBlock.next = blockBestFit.next;
                newBlock.prev = blockBestFit;
                if (blockBestFit.next !== null) {
                    blockBestFit.next.prev = newBlock;
                }
                blockBestFit.next = newBlock;
                newBlock.fromPartition = true;

                // Adjust the size of the current block
                blockBestFit.size = process.size;
            }

            blockBestFit.setProcess(process);
            process.allocatedBlock = blockBestFit;
            return true;
        }

        return false; // No suitable block found for allocation
    };

    this.deallocateProcess = function(process) {
        process.allocatedBlock.setProcess(null);
        process.allocatedBlock = null;
    };

    this.add = function(block) {
        if (this.head == null) {
            this.head = block;
        } else {
            block.next = this.head;
            this.head.prev = block;
            this.head = block;
        }

        this.size += block.size;
    };

    this.toString = function() {
        let string = "[|";
        let block = this.head;

        while (block != null) {
            let prefix = block.available ? "<span style='color: #01DF01;'> " : "<span style='color: #FF0000;'> ";
            let suffix = "</span> |";
            string += (prefix + block.size + suffix);
            block = block.next;
        }

        string += "]";
        return string;
    };

    this.repaint = function() {
        let block = this.head;
        memoryDiv.innerHTML = "";

        while (block != null) {
            let height = (block.size / heap.size) * 100;
            if (block.fromPartition) {
                height += (memControlBlockSize / heap.size) * 100;
            }

            // Create div block element
            let divBlock = document.createElement("div");
            divBlock.style.height = height + "%";
            divBlock.setAttribute("id", "block");
            divBlock.className = block.available ? "available" : "unavailable";
            memoryDiv.appendChild(divBlock);

            // Add size label
            let blockLabel = document.createElement("div");
            blockLabel.setAttribute("id", "blockLabel");
            blockLabel.style.height = height + "%";
            blockLabel.innerHTML = block.size + "K";
            if (height <= 2) {
                blockLabel.style.display = "none";
            }
            divBlock.appendChild(blockLabel);

            block = block.next;
        }
    };
}

// Handle front-end process submission
document.getElementById("processForm").onsubmit = function () {
    let elements = this.elements; // Form elements

    let inProcessSize = elements.namedItem("processSize");
    let inProcessTime = elements.namedItem("processTime");

    let process = new Process(parseInt(inProcessSize.value), parseInt(inProcessTime.value));

    processes.push(process);
    addProcessToTable(process);

    // Allocate process to memory using best fit method
    heap.requestAllocation(process);

    // Debug log
    log("Requesting: " + process.size);
    log(heap.toString() + "<br>");

    // Clear form
    inProcessSize.value = "";
    inProcessTime.value = "";

    return false;
};

function log(string) {
    logBox.innerHTML += string + "<br />";
}

function addProcessToTable(process) {
    let row = document.createElement("tr");
    row.setAttribute("id", "process" + process.id);

    let colName = document.createElement("td");
    colName.innerHTML = process.id;

    let colSize = document.createElement("td");
    colSize.innerHTML = process.size;

    let colTime = document.createElement("td");
    colTime.setAttribute("id", "process" + process.id + "timeLeft");
    colTime.innerHTML = process.timeLeft;

    row.appendChild(colName);
    row.appendChild(colSize);
    row.appendChild(colTime);

    processTable.appendChild(row);
}

function removeProcessFromTable(process) {
    processTable.removeChild(document.getElementById("process" + process.id));
}

// Update 'time left' for each row in table 
function refreshTable() {
    for (let i = 0; i < processes.length; i++) {
        let process = processes[i];
        document.getElementById("process" + process.id + "timeLeft").innerHTML = process.timeLeft;
    }
}

let logBox = document.getElementById("logBox");
let memoryDiv = document.getElementById("memory");
let processTable = document.getElementById("processTable");

let memControlBlockSize = 16;
let processID = 0;
let processes = [];

let heap = new Heap();
let blockSizes = [216, 250, 330, 256];

for (let i = 0; i < blockSizes.length; i++) {
    heap.add(new MemControlBlock(blockSizes[i]));
}

// Draw initial heap
heap.repaint();

// Start clock
// Loop through all processes and allocate those that require allocation. Deallocate those that have <0 time remaining
let clock = setInterval(function() {
    for (let i = 0; i < processes.length; i++) {
        let process = processes[i];

        if (process.isAllocated()) {
            process.tick();
            if (process.timeLeft < 1) {
                // Deallocate process from heap
                heap.deallocateProcess(process);

                // Remove process from processes array
                let index = processes.indexOf(process);
                if (index > -1) {
                    processes.splice(index, 1);
                }

                // Remove process from table
                removeProcessFromTable(process);
            }
        }
    }

    refreshTable();
    heap.repaint();
}, 1000);
