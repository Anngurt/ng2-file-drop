import { Directive, EventEmitter, ElementRef, Renderer, HostListener, Output, Input, OnInit } from '@angular/core';

import { FileState } from '../utilities/file-state';
import { DropZoneStyle } from '../utilities/drop-zone-style';
import { RejectionReasons } from '../properties/rejection-reasons';

import { AcceptedFile } from '../dropped-files/accepted-file';
import { RejectedFile } from '../dropped-files/rejected-file';

//
// Directive to support dragging and dropping and element onto a div
//
@Directive({
    // Selector required in component HTML
    selector: '[ng2FileDrop]',
})
export class FileDropDirective implements OnInit {

    @Output()
    public ng2FileDropHoverStart: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    public ng2FileDropHoverEnd: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    public ng2FileDropFileDropped: EventEmitter<AcceptedFile> = new EventEmitter<AcceptedFile>();
    @Output()
    public ng2FileDropFileRejected: EventEmitter<RejectedFile> = new EventEmitter<RejectedFile>();

    @Input()
    public ng2FileDropSupportedFileTypes: string[];
    @Input()
    public ng2FileDropMaximumSizeBytes: number;

    // Keep track of our dropped files
    private fileService: FileState = new FileState();
    private dropZoneStyle: DropZoneStyle = null;

    //
    // Constructor requires an element reference that instantiated this directive
    //
    public constructor(private element: ElementRef, private renderer: Renderer) {
    }

    //
    // Initialisation
    //
    public ngOnInit() {

        // Set our properties
        this.fileService.setExpectedFileProperties(this.ng2FileDropSupportedFileTypes, this.ng2FileDropMaximumSizeBytes);
        this.dropZoneStyle = new DropZoneStyle(this.element, this.renderer);
    }

    //
    // Called when the element has content dragged over
    //
    @HostListener('dragover', ['$event'])
    public onDragOver(event: DragEvent): void {

        // If we're already in the on-drag, don't bother with this
        if (this.fileService.currentFile === null) {

            // Get the object being dragged and reference it as a copy action
            this.fileService.currentFile = this.getDataTransferObject(event);
            if (this.fileService.currentFile === null) {
                return;
            }

            // Let the client know
            this.ng2FileDropHoverStart.emit();
            this.dropZoneStyle.onHoverStart();
        }

        // Don't propagate
        this.preventAndStopEventPropagation(event);
    }

    //
    // Called when the element has dragged content leave
    //
    @HostListener('dragleave', ['$event'])
    public onDragLeave(event: DragEvent): void {

        // Only bother if we have a file
        if (this.fileService.currentFile !== null) {

            // Finished with the file
            this.fileService.currentFile = null;
            if (event.currentTarget === (this as any).element[0]) {
                return;
            }

            // Let the client know
            this.ng2FileDropHoverEnd.emit();
            this.dropZoneStyle.onHoverEnd();
        }

        // Don't let it continue
        this.preventAndStopEventPropagation(event);
    }

    //
    // Called when the element has content dropped
    //
    @HostListener('drop', ['$event'])
    public onDrop(event: DragEvent): void {

        // Only bother if we have a file
        if (this.fileService.currentFile !== null) {

            // Let the client know
            this.ng2FileDropHoverEnd.emit();
            this.dropZoneStyle.onHoverEnd();

            // Update our data
            this.fileService.currentFile = this.getDataTransferObject(event);

            // Get the file
            let fileData: File = this.fileService.getFileData();

            // Check if our file is valid or not
            let rejectionReason: RejectionReasons = this.fileService.isFileValid();
            if (rejectionReason === RejectionReasons.None) {
                this.ng2FileDropFileDropped.emit(new AcceptedFile(fileData));
                this.dropZoneStyle.onFileAccepted();
            } else {
                this.ng2FileDropFileRejected.emit(new RejectedFile(fileData, rejectionReason));
                this.dropZoneStyle.onFileRejected();
            }

            // Finished with the file
            this.fileService.currentFile = null;
        }

        // Don't let it continue
        this.preventAndStopEventPropagation(event);
    }

    //
    // Stops the drag/drop events propagating
    //
    private preventAndStopEventPropagation(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    //
    // Returns the file dragged into the directive
    //
    private getDataTransferObject(event: DragEvent | any): DataTransfer {
        return event.dataTransfer ? event.dataTransfer : event.originalEvent.dataTransfer;
    }
}
