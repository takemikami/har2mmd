import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Select, { SelectChangeEvent }  from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import mermaid from "mermaid";
import {har2hosts, har2mmd} from "./har2mmd";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};


function HarToMmd() {
    mermaid.initialize({ startOnLoad: false });

    // load file
    const [fileHar, setFileHar] = React.useState<File>();
    const [fileHarName, setFileHarName] = React.useState('');
    const onChangeFileHar = (event: React.FormEvent) => {
        const files = (event.target as HTMLInputElement).files
        if (files) {
            setFileHar(files[0]);
            setFileHarName(files[0]['name']);

            // update host list
            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                if (e && e.target && e.target.result) {
                    const hosts = har2hosts(e.target.result.toString()).sort()
                    const selectHosts = targetHosts
                    setHosts(hosts)
                    var newSelectedHosts = []
                    for (const e of selectHosts) {
                        if(hosts.includes(e)) {
                            newSelectedHosts.push(e)
                        }
                    }
                    setTargetHosts(newSelectedHosts)
                }
            }
            fileReader.readAsText(files[0]);
        }
    };

    // select host and notes
    const [hosts, setHosts] = React.useState<string[]>([]);
    const [targetHosts, setTargetHosts] = React.useState<string[]>([]);
    const onChangeTargetHost = (event: SelectChangeEvent<typeof targetHosts>) => {
        const {
            target: { value },
        } = event;
        setTargetHosts(
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const notes = ["params", "send_cookies", "set_cookies", "value"]
    const [targetNotes, setTargetNotes] = React.useState<string[]>([]);
    const onChangeTargetNotes = (event: SelectChangeEvent<typeof targetNotes>) => {
        const {
            target: { value },
        } = event;
        setTargetNotes(
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    // view diagram
    function handleView() {
        if(fileHar) {
            const fileReader = new FileReader();
            fileReader.onload = (e2) => {
                if (e2 && e2.target && e2.target.result) {
                    const mmdString = har2mmd(e2.target.result.toString(), targetHosts, targetNotes, {"compact": true})
                    const svg = mermaid.mermaidAPI.render(
                        'g-svg',
                        mmdString,
                        undefined
                    );
                    const svgCode = document.getElementById("g");
                    if(svgCode) svgCode.innerHTML = svg;
                    setMmdText(mmdString)
                }
            }
            fileReader.readAsText(fileHar);
        }
    }
    const [mmdText, setMmdText] = React.useState('');

    return (
        <div>
            <Box sx={{ my: 0 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sx={{ my: 0 }}>
                        <FormControl sx={{ m: 1, width: 300 }}>
                            <TextField
                                id="har-file"
                                label="har file"
                                value={fileHarName}
                                variant="filled"
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        </FormControl>
                        <FormControl sx={{ m: 1, mt:3, width: 300 }}>
                            <Button
                                component="label"
                                variant="outlined"
                            >
                                Choose har file
                                <input
                                    type="file"
                                    hidden
                                    onChange={onChangeFileHar}
                                />
                            </Button>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sx={{ my: 0 }}>
                        <FormControl sx={{ m: 1, width: 300 }}>
                            <InputLabel id="demo-multiple-checkbox-label">Hosts</InputLabel>
                            <Select
                                labelId="demo-multiple-checkbox-label"
                                id="demo-multiple-checkbox"
                                multiple
                                value={targetHosts}
                                onChange={onChangeTargetHost}
                                input={<OutlinedInput label="Hosts" />}
                                renderValue={(selected) => selected.join(', ')}
                                MenuProps={MenuProps}
                            >
                                {hosts.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        <Checkbox checked={targetHosts.indexOf(name) > -1} />
                                        <ListItemText primary={name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ m: 1, width: 300 }}>
                            <InputLabel id="demo-multiple-checkbox-label">Notes</InputLabel>
                            <Select
                                labelId="demo-multiple-checkbox-label"
                                id="demo-multiple-checkbox"
                                multiple
                                value={targetNotes}
                                onChange={onChangeTargetNotes}
                                input={<OutlinedInput label="Notes" />}
                                renderValue={(selected) => selected.join(', ')}
                                MenuProps={MenuProps}
                            >
                                {notes.map((note) => (
                                    <MenuItem key={note} value={note}>
                                        <Checkbox checked={targetNotes.indexOf(note) > -1} />
                                        <ListItemText primary={note} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sx={{ my: 0 }}>
                        <FormControl sx={{ m: 1, width: 300 }}>
                            <Button variant="outlined" onClick={handleView}>view network sequence diagram</Button>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ my: 2 }}>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="content-mermaid"
                        id="header-mermaid"
                    >
                        <Typography>Mermaid Code</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <FormControl fullWidth sx={{ m: 1 }} variant="standard">
                            <TextField
                                id="Mermaid-code"
                                label="Mermaid Code"
                                value={mmdText}
                                multiline
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        </FormControl>
                    </AccordionDetails>
                </Accordion>
            </Box>

            <Box sx={{ my: 2 }}>
                <div id="g" className="mermaid" />
            </Box>

        </div>
    )
}

function Copyright() {
    return (
        <div>
            <Typography variant="body2" color="text.secondary" align="center">
                {'Copyright © Takeshi Mikami. All rights reserved.'}
            </Typography>
        </div>
    );
}

export default function App() {
    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Network Sequence viewer from har file.
                </Typography>
                <HarToMmd />
                <Copyright />
            </Box>
        </Container>
    );
}
