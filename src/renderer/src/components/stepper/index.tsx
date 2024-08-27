import { Stepper, Step, StepLabel, CircularProgress, StepConnector, stepConnectorClasses, StepIconProps, styled } from '@mui/material';
import Check from '@mui/icons-material/Check';

// Steps
const steps = [
    {
        label: 'Loading operations',
    },
    {
        label: 'Performing operations',
    },
    {
        label: 'Analyzing the result',
    },
];

const QontoConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 10,
        left: 'calc(-50% + 16px)',
        right: 'calc(50% + 16px)',
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: '#5FB2FF',
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: '#5FB2FF',
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
        borderTopWidth: 3,
        borderRadius: 1,
    },
}));

const QontoStepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(
    ({ theme, ownerState }) => ({
        color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
        display: 'flex',
        height: 22,
        alignItems: 'center',
        ...(ownerState.active && {
            color: '#5FB2FF',
        }),
        '& .QontoStepIcon-completedIcon': {
            color: '#5FB2FF',
            zIndex: 1,
            fontSize: 18
        },
        '& .QontoStepIcon-circle': {
            marginLeft: 9,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
        },
    }),
);

function QontoStepIcon(props: StepIconProps) {
    const { active, completed, className } = props;

    return (
        <QontoStepIconRoot ownerState={{ active }} className={className}>
            {completed ? (
                <Check className="QontoStepIcon-completedIcon" />
            ) : (
                <div className="QontoStepIcon-circle" />
            )}
        </QontoStepIconRoot>
    );
}


export default function LoadingProgressStepper({ activeStep, numberOp, currentOp } ) {
    return (
        <div className='mb-5 mt-5'>
            <Stepper alternativeLabel activeStep={activeStep}
                connector={<QontoConnector />}>
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel StepIconComponent={QontoStepIcon}>
                            {step.label} { index === 1 && <> {currentOp}/{numberOp}</>  }
                            {activeStep === index && (
                                <CircularProgress size={12} sx={{ marginLeft: '8px' }} />
                            )}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
        </div>
    );
}
