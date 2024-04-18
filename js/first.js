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
        this.timeLeft -=1;
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

    // Allocate process to memory using first fit method
    this.requestAllocation = function(process) {
        let block = this.head;

        // Find the first block that can accommodate the process
        while (block != null) {
            if (block.available && block.size >= process.size) {
                // Allocate the process to this block
                if (block.size > process.size) {
                    // Partition block if needed
                    let spaceLeftover = block.size - process.size;
                    if (spaceLeftover >= memControlBlockSize) {
                        // Create a new block for the leftover space
                        let newBlock = new MemControlBlock(spaceLeftover);
                        newBlock.next = block.next;
                        newBlock.prev = block;
                        if (block.next !== null) {
                            block.next.prev = newBlock;
                        }
                        block.next = newBlock;
                        newBlock.fromPartition = true;
                    }
                    // Adjust the size of the current block
                
                    block.size = process.size;
                }
                block.setProcess(process);
                process.allocatedBlock = block;
                return true;
            }
            block = block.next;
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

    if (heap.requestAllocation(process)) {
        processes.push(process);
        addProcessToTable(process);

        // Debug log
        log("Requesting: " + process.size);
        log(heap.toString() + "<br>");

        // Clear form
        inProcessSize.value = "";
        inProcessTime.value = "";
    } else {
        log("Insufficient memory to allocate process of size " + process.size + "K<br>");
    }

    return false;
};

function log(string) {
    logBox.innerHTML += (string + "<br />");
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
let  blockSizes = [216, 250, 330, 256];

for (let i = 0; i < blockSizes.length; i++) {
    heap.add(new MemControlBlock(blockSizes[i]));
}

// Draw initial heap
heap.repaint();

// Start clock
let clock = setInterval(function() {
    for (let i = 0; i < processes.length; i++) {
        let process = processes[i];

        if (!process.isAllocated()) {
            heap.requestAllocation(process);
        } else {
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
