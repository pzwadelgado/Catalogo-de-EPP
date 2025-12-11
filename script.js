document.addEventListener('DOMContentLoaded', () => {
    const book = document.getElementById('book');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Cargar páginas desde localStorage o usar las iniciales
    let pages = JSON.parse(localStorage.getItem('catalogPages_v3')) || [...initialPages];
    let currentPage = 0;
    let pageElements = [];

    function setupBook() {
        book.innerHTML = '';
        pageElements = [];
        currentPage = 0;

        const bookPages = [...pages];
        if (bookPages.length % 2 !== 0) {
            bookPages.push(null); // Añadir una página en blanco al final si el número es impar
        }

        for (let i = 0; i < bookPages.length; i += 2) {
            const sheet = document.createElement('div');
            sheet.classList.add('page');

            const front = document.createElement('div');
            front.classList.add('page-content', 'front');
            if (bookPages[i]) {
                const frontImg = document.createElement('img');
                frontImg.src = bookPages[i];
                frontImg.onerror = () => {
                    console.error(`Error al cargar la imagen: ${bookPages[i]}`);
                    front.innerHTML = `<div class="error-placeholder">Error al cargar: ${bookPages[i].split('/').pop()}</div>`;
                };
                front.appendChild(frontImg);
            }

            const back = document.createElement('div');
            back.classList.add('page-content', 'back');
            if (bookPages[i + 1]) {
                const backImg = document.createElement('img');
                backImg.src = bookPages[i + 1];
                backImg.onerror = () => {
                    console.error(`Error al cargar la imagen: ${bookPages[i + 1]}`);
                    back.innerHTML = `<div class="error-placeholder">Error al cargar: ${bookPages[i + 1].split('/').pop()}</div>`;
                };
                back.appendChild(backImg);
            }
            
            sheet.appendChild(front);
            sheet.appendChild(back);
            pageElements.push(sheet);
        }

        // 3. Añadir todas las hojas al libro y establecer z-index
        pageElements.forEach((el, index) => {
            el.style.zIndex = pageElements.length - index;
            book.appendChild(el);
        });

        updateButtons();
    }

    function turnPage(direction) {
        const numSheets = pageElements.length;
        if (direction === 'next' && currentPage < numSheets) {
            pageElements[currentPage].style.zIndex = currentPage + 1; // Mover al frente de las páginas de la izquierda
            pageElements[currentPage].classList.add('flipped');
            currentPage++;
        } else if (direction === 'prev' && currentPage > 0) {
            currentPage--;
            pageElements[currentPage].style.zIndex = numSheets - currentPage; // Restaurar z-index original
            pageElements[currentPage].classList.remove('flipped');
        }
        updateButtons();
    }

    function updateButtons() {
        const numSheets = pageElements.length;
        const hasOddPages = pages.length % 2 !== 0;

        prevBtn.disabled = currentPage === 0;

        // Si hay un número impar de páginas y estamos en la última hoja,
        // ya hemos mostrado la última página al frente, así que desactivamos 'siguiente'.
        if (hasOddPages && currentPage === numSheets - 1) {
            nextBtn.disabled = true;
        } else {
            nextBtn.disabled = currentPage === numSheets;
        }
    }

    nextBtn.addEventListener('click', () => turnPage('next'));
    prevBtn.addEventListener('click', () => turnPage('prev'));

    setupBook();
    updateButtons();

    // --- Modal de Configuración ---
    const settingsBtn = document.getElementById('settings-btn');
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.querySelector('.close-btn');
    const pageList = document.getElementById('page-list');

    function populatePageList() {
        const oldScrollTop = pageList.scrollTop;
        pageList.innerHTML = ''; // Limpiar lista existente
        pages.forEach((pageSrc, index) => {
            const listItem = document.createElement('li');
            listItem.dataset.originalIndex = index; 
            listItem.draggable = true;

            const img = document.createElement('img');
            img.src = pageSrc;
            
            const text = document.createElement('span');
            text.textContent = pageSrc.split('/').pop();

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que se dispare el drag-and-drop
                const itemToRemove = e.target.closest('li');
                const indexToRemove = parseInt(itemToRemove.dataset.originalIndex, 10);
                
                // Encuentra el índice correcto en el array 'pages' actual
                const pageSrcToRemove = pages[indexToRemove];
                const currentIndexInPages = pages.findIndex(p => p === pageSrcToRemove);

                if (currentIndexInPages !== -1) {
                    pages.splice(currentIndexInPages, 1);
                    populatePageList(); // Repoblar para actualizar índices y la vista
                }
            });

            listItem.appendChild(img);
            listItem.appendChild(text);
            listItem.appendChild(deleteBtn); // Añadir el botón de eliminar
            pageList.appendChild(listItem);
        });
        pageList.scrollTop = oldScrollTop;
    }

    function openModal() {
        populatePageList();
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    settingsBtn.addEventListener('click', () => {
        const password = prompt("Por favor, introduce la clave para acceder a la configuración:");
        if (password === "1465") {
            openModal();
        } else if (password !== null) { // No mostrar alerta si el usuario cancela
            alert("Clave incorrecta.");
        }
    });

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // --- Lógica para añadir y guardar páginas ---
    const imageUpload = document.getElementById('image-upload');
    const addPageBtn = document.getElementById('add-page-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    let filesToUpload = [];

    imageUpload.addEventListener('change', (event) => {
        filesToUpload = [...event.target.files];
    });

    addPageBtn.addEventListener('click', () => {
        if (filesToUpload.length === 0) {
            alert('Por favor, selecciona uno o más archivos de imagen.');
            return;
        }

        filesToUpload.forEach(file => {
            const newPageSrc = URL.createObjectURL(file);
            pages.push(newPageSrc);
        });

        populatePageList(); // Actualizar la lista en el modal

        // Limpiar la selección
        filesToUpload = [];
        imageUpload.value = '';
    });

    saveChangesBtn.addEventListener('click', () => {
        // Guardar el orden actual en localStorage
        localStorage.setItem('catalogPages', JSON.stringify(pages));

        // Reconstruir el libro con el array 'pages' actualizado
        currentPage = 0; // Volver a la primera página
        setupBook();
        closeModal();
    });

    // --- Lógica de Drag-and-Drop ---
    let dragSrcElement = null;

    pageList.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'LI') {
            dragSrcElement = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.target.classList.add('dragging');
        }
    });

    pageList.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!dragSrcElement) return;
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('li');
        if (target && target !== dragSrcElement) {
            const rect = target.getBoundingClientRect();
            const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            pageList.insertBefore(dragSrcElement, next && target.nextSibling || target);
        }
    });

    pageList.addEventListener('dragend', (e) => {
        if (dragSrcElement) {
            dragSrcElement.classList.remove('dragging');
            
            // Crear un nuevo array 'pages' basado en el nuevo orden del DOM
            const newPagesOrder = [];
            const listItems = pageList.querySelectorAll('li');
            listItems.forEach(item => {
                const originalIndex = parseInt(item.dataset.originalIndex, 10);
                newPagesOrder.push(pages[originalIndex]);
            });
            
            // Actualizar el array principal y repoblar la lista para confirmar el cambio
            pages = newPagesOrder;
            populatePageList();
        }
        dragSrcElement = null;
    });
});
