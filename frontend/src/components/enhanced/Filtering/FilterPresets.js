import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
} from '@mui/material';
import {
  Star,
  StarBorder,
  Delete,
  Edit,
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material';
import './FilterPresets.css';

const FilterPresets = ({ presets, onSelectPreset, onSavePreset, onDeletePreset, disabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="filter-presets-card">
      <CardContent>
        <Box className="presets-header" onClick={() => setIsExpanded(!isExpanded)}>
          <Typography variant="h6" className="presets-title">
            <Star /> Filter Presets
          </Typography>
          <IconButton>
            {isExpanded ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
        </Box>
        <Collapse in={isExpanded}>
          <Divider />
          <List>
            {presets.map((preset) => (
              <ListItem
                key={preset.id}
                button
                onClick={() => onSelectPreset(preset.filters)}
                disabled={disabled}
                className="preset-item"
              >
                <ListItemText
                  primary={preset.name}
                  secondary={`${preset.filters.length} conditions`}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Edit Preset">
                    <span>
                      <IconButton edge="end" disabled={disabled}>
                        <Edit />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete Preset">
                    <span>
                      <IconButton
                        edge="end"
                        onClick={() => onDeletePreset(preset.id)}
                        disabled={disabled}
                      >
                        <Delete />
                      </IconButton>
                    </span>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Box mt={2} display="flex" justifyContent="center">
            <Button
              variant="contained"
              onClick={onSavePreset}
              disabled={disabled}
            >
              Save Current as Preset
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FilterPresets;