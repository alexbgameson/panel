import React from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { join } from 'path';
import renameFile from '@/api/server/files/renameFile';
import { ServerContext } from '@/state/server';
import { FileObject } from '@/api/server/files/loadDirectory';
import classNames from 'classnames';

interface FormikValues {
    name: string;
}

type Props = RequiredModalProps & { file: FileObject; useMoveTerminology?: boolean };

export default ({ file, useMoveTerminology, ...props }: Props) => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const directory = ServerContext.useStoreState(state => state.files.directory);
    const { pushFile, removeFile } = ServerContext.useStoreActions(actions => actions.files);

    const submit = (values: FormikValues, { setSubmitting }: FormikHelpers<FormikValues>) => {
        const renameFrom = join(directory, file.name);
        const renameTo = join(directory, values.name);

        renameFile(uuid, { renameFrom, renameTo })
            .then(() => {
                if (!useMoveTerminology && values.name.split('/').length === 1) {
                    pushFile({ ...file, name: values.name });
                }

                if ((useMoveTerminology || values.name.split('/').length > 1) && file.uuid.length > 0) {
                    removeFile(file.uuid);
                }

                props.onDismissed();
            })
            .catch(error => {
                setSubmitting(false);
                console.error(error);
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ name: file.name }}
        >
            {({ isSubmitting, values }) => (
                <Modal {...props} dismissable={!isSubmitting} showSpinnerOverlay={isSubmitting}>
                    <Form className={'m-0'}>
                        <div
                            className={classNames('flex', {
                                'items-center': useMoveTerminology,
                                'items-end': !useMoveTerminology,
                            })}
                        >
                            <div className={'flex-1 mr-6'}>
                                <Field
                                    type={'string'}
                                    id={'file_name'}
                                    name={'name'}
                                    label={'File Name'}
                                    description={useMoveTerminology
                                        ? 'Enter the new name and directory of this file or folder, relative to the current directory.'
                                        : undefined
                                    }
                                    autoFocus={true}
                                />
                            </div>
                            <div>
                                <button className={'btn btn-sm btn-primary'}>
                                    {useMoveTerminology ? 'Move' : 'Rename'}
                                </button>
                            </div>
                        </div>
                        {useMoveTerminology &&
                        <p className={'text-xs mt-2 text-neutral-400'}>
                            <strong className={'text-neutral-200'}>New location:</strong>
                            &nbsp;/home/container/{join(directory, values.name).replace(/^(\.\.\/|\/)+/, '')}
                        </p>
                        }
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};
