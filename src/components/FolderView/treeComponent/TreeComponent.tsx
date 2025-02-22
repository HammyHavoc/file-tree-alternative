import { TFolder, Notice } from 'obsidian';
import React, { useState, useMemo, useEffect } from 'react';
import { animated, config, Spring } from 'react-spring';
import FileTreeAlternativePlugin from 'main';
import Dropzone from 'react-dropzone';
import { getFolderIcon } from 'utils/icons';
import { IoMdArrowDropright } from 'react-icons/io';
import * as recoilState from 'recoil/pluginState';
import { useRecoilState } from 'recoil';

type TreeProps = {
    open?: boolean;
    content?: string;
    onClick?: Function;
    onContextMenu?: Function;
    type?: any;
    style?: any;
    children?: any;
    isRootFolder?: boolean;
    folder: TFolder;
    plugin: FileTreeAlternativePlugin;
};

export default function Tree(props: TreeProps) {
    // Global States
    const [openFolders, setOpenFolders] = useRecoilState(recoilState.openFolders);
    const [folderFileCountMap] = useRecoilState(recoilState.folderFileCountMap);
    const [activeFolderPath] = useRecoilState(recoilState.activeFolderPath);

    // Local States
    const [open, setOpen] = useState<boolean>(props.open);
    const [highlight, setHightlight] = useState<boolean>(false);

    const isFolderActive = props.folder.path === activeFolderPath;

    // --> For state update from outside of the component
    useEffect(() => setOpen(props.open), [props.open]);

    // --> Icon to be toggled between min(-) and plus(+) Each click sets openFolders Main Component state to save in settings
    const toggle = () => {
        if (props.children) {
            // Set State in Main Component for Keeping Folders Open
            if (!open) {
                setOpenFolders([...openFolders, props.folder.path]);
            } else {
                const newOpenFolders = openFolders.filter((openFolder) => props.folder.path !== openFolder);
                setOpenFolders(newOpenFolders);
            }
            // Set State Open for the Folder
            setOpen(!open);
        }
    };

    // --> Function After an External File Dropped into Folder Name
    const onDrop = (files: File[]) => {
        files.map(async (file) => {
            file.arrayBuffer().then((arrayBuffer) => {
                props.plugin.app.vault.adapter.writeBinary(props.folder.path + '/' + file.name, arrayBuffer);
            });
        });
    };

    // --> Click Events
    const folderNameClickEvent = (ev: React.MouseEvent) => {
        if (props.plugin.settings.folderNote && ev.shiftKey) {
            const fileFullPath = `${props.folder.path}/${props.folder.name}.md`;
            const folderNoteFile = props.plugin.app.vault.getAbstractFileByPath(fileFullPath);
            if (folderNoteFile) {
                props.plugin.app.workspace.openLinkText(fileFullPath, '/', false);
            } else {
                new Notice('There is no note for this folder created');
            }
        } else {
            props.onClick();
        }
    };
    const folderContextMenuEvent = () => props.onContextMenu();

    // --> Icon
    const Icon = useMemo(() => getFolderIcon(props.plugin, props.children, open), [open, props.children]);

    return (
        <Dropzone
            onDrop={onDrop}
            noClick={true}
            onDragEnter={() => setHightlight(true)}
            onDragLeave={() => setHightlight(false)}
            onDropAccepted={() => setHightlight(false)}
            onDropRejected={() => setHightlight(false)}>
            {({ getRootProps, getInputProps }) => (
                <div style={{ ...props.style }} className="treeview">
                    <div
                        {...getRootProps({ className: 'dropzone' })}
                        className={'oz-folder-element' + (highlight ? ' drag-entered' : '')}
                        data-path={props.folder.path}>
                        <input {...getInputProps()} />

                        <div className="oz-folder-line">
                            <div className="oz-icon-div">
                                <Icon className="oz-folder-toggle" style={{ opacity: props.children ? 1 : 0.3 }} onClick={toggle} />
                            </div>

                            <div className="oz-folder-block" onClick={folderNameClickEvent} onContextMenu={folderContextMenuEvent}>
                                <div className="oz-folder-type" style={{ marginRight: props.type ? 10 : 0 }}>
                                    {props.type}
                                </div>
                                <div
                                    className={`oz-folder-name ${isFolderActive ? 'is-folder-active' : ''}${props.isRootFolder ? ' is-root-folder' : ''}`}>
                                    {props.content}{' '}
                                    {props.plugin.settings.folderNote && props.folder.children.some((f) => f.name === `${props.folder.name}.md`) ? (
                                        <IoMdArrowDropright size={10} className="oz-folder-note-icon" />
                                    ) : (
                                        ''
                                    )}
                                </div>
                                {!open && folderFileCountMap[props.folder.path] && (
                                    <div className={`oz-folder-count ${props.plugin.settings.showRootFolder ? 'with-root' : 'no-root'}`}>
                                        <span className="oz-nav-file-tag">{folderFileCountMap[props.folder.path]}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Spring
                        native
                        immediate={true}
                        config={{
                            ...config.default,
                            restSpeedThreshold: 1,
                            restDisplacementThreshold: 0.01,
                        }}
                        from={{ height: 0, opacity: 0, transform: 'translate3d(20px,0,0)' }}
                        to={{
                            height: open && props.children ? 'auto' : 0,
                            opacity: open && props.children ? 1 : 0,
                            transform: open && props.children ? 'translate3d(0px,0,0)' : 'translate3d(20px,0,0)',
                        }}
                        render={Contents}>
                        {props.children}
                    </Spring>
                </div>
            )}
        </Dropzone>
    );
}

// @ts-ignore
const Contents = ({ children, ...style }) => (
    <animated.div style={{ ...style }} className="oz-folder-contents">
        {children}
    </animated.div>
);
